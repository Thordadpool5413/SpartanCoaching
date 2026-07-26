import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const VERSION = "v2";

function encryptionKey(): Buffer {
  const raw = process.env.AI_TOOL_ENCRYPTION_KEY?.trim();
  if (!raw) throw new Error("AI_TOOL_ENCRYPTION_KEY is required for PHI data");
  const key = /^[0-9a-f]{64}$/i.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("AI_TOOL_ENCRYPTION_KEY must decode to exactly 32 bytes");
  }
  return key;
}

export function encryptPhi(value: unknown, aad: string): string {
  const dataKey = randomBytes(32);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", dataKey, iv);
  cipher.setAAD(Buffer.from(aad, "utf8"));
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const keyIv = randomBytes(12);
  const keyCipher = createCipheriv("aes-256-gcm", encryptionKey(), keyIv);
  keyCipher.setAAD(Buffer.from(`dek:${aad}`, "utf8"));
  const wrappedKey = Buffer.concat([keyCipher.update(dataKey), keyCipher.final()]);
  const keyTag = keyCipher.getAuthTag();
  return [VERSION, keyIv, keyTag, wrappedKey, iv, tag, ciphertext]
    .map((part) => (typeof part === "string" ? part : part.toString("base64url")))
    .join(".");
}

export function decryptPhi<T>(payload: string, aad: string): T {
  const parts = payload.split(".");
  if (parts[0] === "v1") {
    const [, ivText, tagText, ciphertextText] = parts;
    if (!ivText || !tagText || !ciphertextText) {
      throw new Error("Encrypted PHI payload is malformed");
    }
    const legacy = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(ivText, "base64url"),
    );
    legacy.setAAD(Buffer.from(aad, "utf8"));
    legacy.setAuthTag(Buffer.from(tagText, "base64url"));
    const plaintext = Buffer.concat([
      legacy.update(Buffer.from(ciphertextText, "base64url")),
      legacy.final(),
    ]);
    return JSON.parse(plaintext.toString("utf8")) as T;
  }
  const [version, keyIvText, keyTagText, wrappedKeyText, ivText, tagText, ciphertextText] =
    parts;
  if (
    version !== VERSION ||
    !keyIvText ||
    !keyTagText ||
    !wrappedKeyText ||
    !ivText ||
    !tagText ||
    !ciphertextText
  ) {
    throw new Error("Encrypted PHI payload is malformed");
  }
  const keyDecipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(keyIvText, "base64url"),
  );
  keyDecipher.setAAD(Buffer.from(`dek:${aad}`, "utf8"));
  keyDecipher.setAuthTag(Buffer.from(keyTagText, "base64url"));
  const dataKey = Buffer.concat([
    keyDecipher.update(Buffer.from(wrappedKeyText, "base64url")),
    keyDecipher.final(),
  ]);
  const decipher = createDecipheriv(
    "aes-256-gcm",
    dataKey,
    Buffer.from(ivText, "base64url"),
  );
  decipher.setAAD(Buffer.from(aad, "utf8"));
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextText, "base64url")),
    decipher.final(),
  ]);
  return JSON.parse(plaintext.toString("utf8")) as T;
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${canonical(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function sha256Value(value: unknown): string {
  return createHash("sha256").update(canonical(value)).digest("hex");
}

export function sha256Text(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
