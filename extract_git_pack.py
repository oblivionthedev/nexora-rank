from pathlib import Path


response_path = Path('.git-upload-pack-response')
pack_path = Path('.git-pack.pack')
data = response_path.read_bytes()

offset = 0
pack_parts: list[bytes] = []

while offset < len(data):
    if offset + 4 > len(data):
        raise RuntimeError('Truncated packet header')

    header = data[offset:offset + 4]
    try:
        packet_length = int(header, 16)
    except ValueError:
        # A non-sideband response switches to a raw PACK stream after NAK.
        if data[offset:offset + 4] == b'PACK':
            pack_parts.append(data[offset:])
            offset = len(data)
            break
        raise RuntimeError(f'Unexpected packet header at byte {offset}: {header!r}')

    offset += 4
    if packet_length == 0:
        continue
    if packet_length < 4 or offset + packet_length - 4 > len(data):
        raise RuntimeError(f'Invalid packet length {packet_length} at byte {offset - 4}')

    payload = data[offset:offset + packet_length - 4]
    offset += packet_length - 4

    if payload in (b'NAK\n',) or payload.startswith(b'ACK '):
        continue
    if not payload:
        continue

    channel = payload[0]
    if channel == 1:
        pack_parts.append(payload[1:])
    elif channel == 2:
        continue
    elif channel == 3:
        raise RuntimeError(payload[1:].decode('utf-8', errors='replace'))
    elif payload.startswith(b'PACK'):
        pack_parts.append(payload)
    else:
        raise RuntimeError(f'Unexpected sideband channel {channel} at byte {offset - len(payload)}')

pack_data = b''.join(pack_parts)
if not pack_data.startswith(b'PACK'):
    raise RuntimeError('Extracted payload is not a Git pack')

pack_path.write_bytes(pack_data)
print(f'Extracted {len(pack_data)} bytes to {pack_path}')
