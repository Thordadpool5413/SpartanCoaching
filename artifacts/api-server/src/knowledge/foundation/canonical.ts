import { createHash } from "node:crypto";
import type { z } from "zod";
export const ordinal = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
export const sortedSet = (values: readonly string[]) =>
  [...new Set(values)].sort(ordinal);
export function fail(code = "KNOWLEDGE_CONTRACT_INVALID"): never {
  throw new Error(code);
}

/** Reject values JSON.stringify would silently drop, coerce or invoke. */
export function assertJson(
  value: unknown,
  ancestors = new Set<object>(),
): void {
  if (value === null || typeof value === "boolean") return;
  if (typeof value === "string") {
    for (let i = 0; i < value.length; i++) {
      const c = value.charCodeAt(i);
      if (c >= 0xd800 && c <= 0xdbff) {
        const next = value.charCodeAt(++i);
        if (!(next >= 0xdc00 && next <= 0xdfff)) fail();
      } else if (c >= 0xdc00 && c <= 0xdfff) fail();
    }
    return;
  }
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value) || Object.is(value, -0)) fail();
    return;
  }
  if (typeof value !== "object") fail();
  const object = value as object;
  if (ancestors.has(object)) fail();
  if (
    !Array.isArray(object) &&
    Object.getPrototypeOf(object) !== Object.prototype &&
    Object.getPrototypeOf(object) !== null
  )
    fail();
  ancestors.add(object);
  const descriptors = Object.getOwnPropertyDescriptors(object);
  const keys = Reflect.ownKeys(descriptors);
  if (keys.some((key) => typeof key !== "string")) fail();
  if (Array.isArray(object)) {
    if (keys.length !== object.length + 1) fail();
    for (let i = 0; i < object.length; i++) {
      const descriptor = descriptors[String(i)];
      if (!descriptor || !descriptor.enumerable || !("value" in descriptor))
        fail();
      assertJson(descriptor.value, ancestors);
    }
  } else {
    for (const key of keys as string[]) {
      const descriptor = descriptors[key];
      if (!descriptor.enumerable || !("value" in descriptor)) fail();
      assertJson(key, ancestors);
      assertJson(descriptor.value, ancestors);
    }
  }
  ancestors.delete(object);
}
export function parseContract<T extends z.ZodTypeAny>(
  schema: T,
  input: unknown,
): z.output<T> {
  assertJson(input);
  const parsed = schema.safeParse(input);
  if (!parsed.success) fail();
  return parsed.data;
}
export function canonicalBytes(value: unknown): string {
  assertJson(value);
  const encode = (v: unknown): string => {
    if (v === null || typeof v !== "object") return JSON.stringify(v);
    if (Array.isArray(v)) return `[${v.map(encode).join(",")}]`;
    const record = v as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort(ordinal)
      .map((key) => `${JSON.stringify(key)}:${encode(record[key])}`)
      .join(",")}}`;
  };
  return encode(value);
}
export const sha256 = (bytes: string) =>
  createHash("sha256").update(bytes, "utf8").digest("hex");
export const canonicalDigest = (value: unknown) =>
  sha256(canonicalBytes(value));

/** Own even opaque foreign inventory without executing accessors or requiring JSON. */
export function metadataSnapshot<T>(input: T): T {
  const copies = new Map<object, object>();
  const pending: object[] = [];
  const copy = (value: unknown): unknown => {
    if (value === null || typeof value !== "object") return value;
    const existing = copies.get(value);
    if (existing) return existing;
    const result = Array.isArray(value)
      ? []
      : Object.create(Object.getPrototypeOf(value));
    copies.set(value, result);
    pending.push(value);
    return result;
  };
  const result = copy(input);
  while (pending.length) {
    const source = pending.pop()!;
    const target = copies.get(source)!;
    for (const key of Reflect.ownKeys(source)) {
      if (Array.isArray(source) && key === "length") continue;
      const descriptor = Object.getOwnPropertyDescriptor(source, key)!;
      if ("value" in descriptor) descriptor.value = copy(descriptor.value);
      Object.defineProperty(target, key, descriptor);
    }
    if (Array.isArray(source)) (target as unknown[]).length = source.length;
  }
  for (const value of copies.values()) Object.freeze(value);
  return result as T;
}
