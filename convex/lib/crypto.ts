/**
 * AES-256-GCM encryption utilities for Convex actions.
 * Uses Web Crypto API available in the Convex runtime.
 * The secret is hashed with SHA-256 to produce a consistent 32-byte key.
 */

const deriveKey = async (secret: string): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const secretBytes = encoder.encode(secret);
  const hashBuffer = await crypto.subtle.digest("SHA-256", secretBytes);
  return crypto.subtle.importKey(
    "raw",
    hashBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
};

const toBase64 = (buffer: ArrayBuffer): string => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
};

const fromBase64 = (b64: string): Uint8Array => {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
};

const encryptApiKey = async (
  plaintext: string,
  secret: string,
): Promise<{ encryptedKey: string; iv: string }> => {
  const key = await deriveKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext),
  );
  return {
    encryptedKey: toBase64(encrypted),
    iv: toBase64(iv.buffer),
  };
};

const decryptApiKey = async (
  encryptedKey: string,
  iv: string,
  secret: string,
): Promise<string> => {
  const key = await deriveKey(secret);
  const encryptedBytes = fromBase64(encryptedKey);
  const ivBytes = fromBase64(iv);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes as Uint8Array<ArrayBuffer> },
    key,
    encryptedBytes as Uint8Array<ArrayBuffer>,
  );
  return new TextDecoder().decode(decrypted);
};

export { encryptApiKey, decryptApiKey };
