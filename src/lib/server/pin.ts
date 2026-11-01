const encoder = new TextEncoder();
const PIN_HASH_ITERATIONS = 310_000;

function getPinPepper() {
  const pepper = process.env.PIN_HASH_SECRET?.trim();
  if (!pepper || pepper.length < 32) {
    throw new Error("PIN_HASH_SECRET must contain at least 32 characters.");
  }
  return pepper;
}

export function newPinSalt() {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  return toHex(bytes);
}

export async function hashTransactionPin(pin: string, salt: string) {
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(`${pin}:${getPinPepper()}`),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derived = await globalThis.crypto.subtle.deriveBits({
    name: "PBKDF2",
    salt: fromHex(salt),
    iterations: PIN_HASH_ITERATIONS,
    hash: "SHA-256",
  }, key, 512);
  return toHex(new Uint8Array(derived));
}

export async function verifyTransactionPin(pin: string, salt: string, storedHash: string) {
  if (!/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{128}$/i.test(storedHash)) return false;
  const actual = await hashTransactionPin(pin, salt);
  let difference = 0;
  for (let index = 0; index < 128; index += 1) {
    difference |= actual.charCodeAt(index) ^ storedHash.toLowerCase().charCodeAt(index);
  }
  return difference === 0;
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(value: string) {
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}
