const TOKEN_PREFIX = "v1";

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("=", "")
    .replaceAll("+", "-")
    .replaceAll("/", "_");
}

function base64UrlToBytes(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function secretMaterial() {
  const secret =
    process.env.ROBLOX_TOKEN_ENCRYPTION_KEY?.trim() ||
    process.env.CRON_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("roblox_token_encryption_not_configured");
  }
  return secret;
}

async function encryptionKey() {
  const material = new TextEncoder().encode(
    `nexora:roblox-oauth:v1:${secretMaterial()}`,
  );
  const digest = await crypto.subtle.digest("SHA-256", material);
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export function hasRobloxTokenEncryption() {
  try {
    secretMaterial();
    return true;
  } catch {
    return false;
  }
}

export async function encryptRobloxToken(token: string) {
  if (!token) throw new Error("roblox_token_missing");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await encryptionKey(),
    new TextEncoder().encode(token),
  );
  return `${TOKEN_PREFIX}.${bytesToBase64Url(iv)}.${bytesToBase64Url(new Uint8Array(encrypted))}`;
}

export async function decryptRobloxToken(ciphertext: string) {
  const [version, encodedIv, encodedPayload] = ciphertext.split(".");
  if (version !== TOKEN_PREFIX || !encodedIv || !encodedPayload) {
    throw new Error("roblox_token_ciphertext_invalid");
  }
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64UrlToBytes(encodedIv) },
    await encryptionKey(),
    base64UrlToBytes(encodedPayload),
  );
  return new TextDecoder().decode(decrypted);
}
