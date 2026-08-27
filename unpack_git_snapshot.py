from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import zlib


PACK_PATH = Path('.git-pack.pack')
TARGET_COMMIT = '551137ada8dc4aebd0929ac2d486d27f93635f6b'
ROOT = Path.cwd().resolve()


def read_varint(data: bytes, offset: int) -> tuple[int, int]:
    value = 0
    shift = 0
    while True:
        byte = data[offset]
        offset += 1
        value |= (byte & 0x7F) << shift
        if not byte & 0x80:
            return value, offset
        shift += 7


def apply_delta(base: bytes, delta: bytes) -> bytes:
    base_size, offset = read_varint(delta, 0)
    result_size, offset = read_varint(delta, offset)
    if base_size != len(base):
        raise RuntimeError(f'Delta base size mismatch: {base_size} != {len(base)}')

    output = bytearray()
    while offset < len(delta):
        opcode = delta[offset]
        offset += 1
        if opcode & 0x80:
            copy_offset = 0
            copy_size = 0
            for bit, shift in ((0x01, 0), (0x02, 8), (0x04, 16), (0x08, 24)):
                if opcode & bit:
                    copy_offset |= delta[offset] << shift
                    offset += 1
            for bit, shift in ((0x10, 0), (0x20, 8), (0x40, 16)):
                if opcode & bit:
                    copy_size |= delta[offset] << shift
                    offset += 1
            if copy_size == 0:
                copy_size = 0x10000
            output.extend(base[copy_offset:copy_offset + copy_size])
        elif opcode:
            output.extend(delta[offset:offset + opcode])
            offset += opcode
        else:
            raise RuntimeError('Invalid zero delta opcode')

    if len(output) != result_size:
        raise RuntimeError(f'Delta result size mismatch: {len(output)} != {result_size}')
    return bytes(output)


def object_sha(kind: str, content: bytes) -> str:
    header = f'{kind} {len(content)}\0'.encode()
    return hashlib.sha1(header + content).hexdigest()


pack = PACK_PATH.read_bytes()
if pack[:4] != b'PACK':
    raise RuntimeError('Invalid Git pack signature')
version = int.from_bytes(pack[4:8], 'big')
count = int.from_bytes(pack[8:12], 'big')
if version not in (2, 3):
    raise RuntimeError(f'Unsupported Git pack version: {version}')

entries: list[dict[str, object]] = []
by_offset: dict[int, dict[str, object]] = {}
offset = 12

for _ in range(count):
    object_offset = offset
    byte = pack[offset]
    offset += 1
    kind_number = (byte >> 4) & 0x07
    declared_size = byte & 0x0F
    shift = 4
    while byte & 0x80:
        byte = pack[offset]
        offset += 1
        declared_size |= (byte & 0x7F) << shift
        shift += 7

    entry: dict[str, object] = {
        'offset': object_offset,
        'kind_number': kind_number,
    }

    if kind_number == 6:
        byte = pack[offset]
        offset += 1
        distance = byte & 0x7F
        while byte & 0x80:
            byte = pack[offset]
            offset += 1
            distance = ((distance + 1) << 7) | (byte & 0x7F)
        entry['base_offset'] = object_offset - distance
    elif kind_number == 7:
        entry['base_sha'] = pack[offset:offset + 20].hex()
        offset += 20

    inflater = zlib.decompressobj()
    content = inflater.decompress(pack[offset:]) + inflater.flush()
    if not inflater.eof:
        raise RuntimeError(f'Incomplete compressed object at {object_offset}')
    consumed = len(pack[offset:]) - len(inflater.unused_data)
    offset += consumed
    if len(content) != declared_size:
        raise RuntimeError(
            f'Object size mismatch at {object_offset}: {len(content)} != {declared_size}'
        )
    entry['packed_content'] = content
    entries.append(entry)
    by_offset[object_offset] = entry

type_names = {1: 'commit', 2: 'tree', 3: 'blob', 4: 'tag'}
by_sha: dict[str, tuple[str, bytes]] = {}


def resolve(entry: dict[str, object]) -> tuple[str, bytes] | None:
    if 'resolved' in entry:
        return entry['resolved']  # type: ignore[return-value]

    kind_number = int(entry['kind_number'])
    packed_content = entry['packed_content']
    assert isinstance(packed_content, bytes)

    if kind_number in type_names:
        resolved = (type_names[kind_number], packed_content)
    elif kind_number == 6:
        base = by_offset[int(entry['base_offset'])]
        base_resolved = resolve(base)
        if base_resolved is None:
            return None
        kind, base_content = base_resolved
        resolved = (kind, apply_delta(base_content, packed_content))
    elif kind_number == 7:
        base_resolved = by_sha.get(str(entry['base_sha']))
        if base_resolved is None:
            return None
        kind, base_content = base_resolved
        resolved = (kind, apply_delta(base_content, packed_content))
    else:
        raise RuntimeError(f'Unsupported packed object type: {kind_number}')

    entry['resolved'] = resolved
    sha = object_sha(*resolved)
    entry['sha'] = sha
    by_sha[sha] = resolved
    return resolved


pending = entries[:]
while pending:
    next_pending = []
    progress = 0
    for entry in pending:
        if resolve(entry) is None:
            next_pending.append(entry)
        else:
            progress += 1
    if not progress:
        missing = [entry.get('base_sha') for entry in next_pending]
        raise RuntimeError(f'Unable to resolve delta bases: {missing}')
    pending = next_pending

commit_object = by_sha.get(TARGET_COMMIT)
if commit_object is None or commit_object[0] != 'commit':
    raise RuntimeError(f'Target commit {TARGET_COMMIT} was not found')

commit_text = commit_object[1].decode('utf-8', errors='strict')
tree_line = next(line for line in commit_text.splitlines() if line.startswith('tree '))
root_tree_sha = tree_line.split(' ', 1)[1]

written_files = 0
manifest: list[dict[str, str]] = []


def checkout_tree(tree_sha: str, destination: Path) -> None:
    global written_files
    tree_object = by_sha.get(tree_sha)
    if tree_object is None or tree_object[0] != 'tree':
        raise RuntimeError(f'Tree {tree_sha} was not found')

    data = tree_object[1]
    offset = 0
    while offset < len(data):
        space = data.index(b' ', offset)
        mode = data[offset:space].decode('ascii')
        nul = data.index(b'\0', space + 1)
        name_bytes = data[space + 1:nul]
        child_sha = data[nul + 1:nul + 21].hex()
        offset = nul + 21

        name = os.fsdecode(name_bytes)
        if name in ('.', '..', '.git') or '/' in name or '\\' in name:
            raise RuntimeError(f'Unsafe tree entry name: {name!r}')
        path = (destination / name).resolve()
        if ROOT not in path.parents and path != ROOT:
            raise RuntimeError(f'Unsafe output path: {path}')

        if mode in ('40000', '040000'):
            path.mkdir(parents=True, exist_ok=True)
            checkout_tree(child_sha, path)
        elif mode == '160000':
            continue
        else:
            child = by_sha.get(child_sha)
            if child is None or child[0] != 'blob':
                raise RuntimeError(f'Blob {child_sha} was not found')
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(child[1])
            manifest.append({
                'path': path.relative_to(ROOT).as_posix(),
                'mode': mode.zfill(6),
                'sha': child_sha,
            })
            written_files += 1


checkout_tree(root_tree_sha, ROOT)
Path('.snapshot-manifest.json').write_text(
    json.dumps(sorted(manifest, key=lambda item: item['path']), indent=2),
    encoding='utf-8',
)
print(f'Checked out {written_files} files from commit {TARGET_COMMIT}')
