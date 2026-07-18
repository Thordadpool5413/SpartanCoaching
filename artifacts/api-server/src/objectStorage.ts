import { Storage, File } from "@google-cloud/storage";
import type { Response } from "express";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import {
  ObjectAclPolicy,
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
const LOCAL_STORAGE_DIR = path.resolve(process.env.LOCAL_OBJECT_STORAGE_DIR || "data/object-storage");
const isReplitStorage = process.env.OBJECT_STORAGE_BACKEND === "replit" ||
  (process.env.OBJECT_STORAGE_BACKEND !== "local" && Boolean(process.env.REPL_ID));

export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

type LocalObject = { kind: "local"; id: string; filePath: string; contentType: string; size: number };
type StoredObject = File | LocalObject;

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
  }
}

function parseObjectPath(value: string) {
  const source = value.startsWith("/") ? value : `/${value}`;
  const parts = source.split("/");
  if (parts.length < 3) throw new Error("Invalid object path");
  return { bucketName: parts[1], objectName: parts.slice(2).join("/") };
}

function localObjectId(value: string): string | null {
  try {
    const pathname = value.startsWith("http") ? new URL(value).pathname : value;
    const match = pathname.match(/^\/(?:api\/objects\/upload|objects)\/([0-9a-f-]{36})$/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function localPath(id: string) {
  return path.join(LOCAL_STORAGE_DIR, `${id}.bin`);
}

function localMetadataPath(id: string) {
  return path.join(LOCAL_STORAGE_DIR, `${id}.json`);
}

export class ObjectStorageService {
  private assertLocalId(id: string) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid object upload token");
  }

  private async getLocalObject(id: string): Promise<LocalObject> {
    this.assertLocalId(id);
    const filePath = localPath(id);
    try {
      const [stat, metadataText] = await Promise.all([fs.stat(filePath), fs.readFile(localMetadataPath(id), "utf8")]);
      const metadata = JSON.parse(metadataText) as { contentType?: string };
      return { kind: "local", id, filePath, contentType: metadata.contentType || "application/octet-stream", size: stat.size };
    } catch {
      throw new ObjectNotFoundError();
    }
  }

  getPublicObjectSearchPaths(): string[] {
    const paths = [...new Set((process.env.PUBLIC_OBJECT_SEARCH_PATHS || "").split(",").map((item) => item.trim()).filter(Boolean))];
    if (!paths.length) throw new Error("PUBLIC_OBJECT_SEARCH_PATHS is not set");
    return paths;
  }

  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) throw new Error("PRIVATE_OBJECT_DIR is not set");
    return dir;
  }

  async getObjectEntityUploadURL(): Promise<string> {
    if (!isReplitStorage) return `/api/objects/upload/${randomUUID()}`;
    const { bucketName, objectName } = parseObjectPath(`${this.getPrivateObjectDir()}/uploads/${randomUUID()}`);
    return signObjectURL({ bucketName, objectName, method: "PUT", ttlSec: 900 });
  }

  async saveLocalUpload(id: string, buffer: Buffer, contentType?: string): Promise<void> {
    if (isReplitStorage) throw new Error("Local uploads are unavailable with the Replit storage backend");
    this.assertLocalId(id);
    if (!buffer.length) throw new Error("Uploaded file is empty");
    await fs.mkdir(LOCAL_STORAGE_DIR, { recursive: true });
    await Promise.all([
      fs.writeFile(localPath(id), buffer),
      fs.writeFile(localMetadataPath(id), JSON.stringify({ contentType: contentType || "application/octet-stream" })),
    ]);
  }

  async getObjectEntityFile(objectPath: string): Promise<StoredObject> {
    if (!isReplitStorage) {
      const id = localObjectId(objectPath);
      if (!id) throw new ObjectNotFoundError();
      return this.getLocalObject(id);
    }
    if (!objectPath.startsWith("/objects/")) throw new ObjectNotFoundError();
    const entityId = objectPath.slice("/objects/".length);
    const entityDir = `${this.getPrivateObjectDir().replace(/\/$/, "")}/`;
    const { bucketName, objectName } = parseObjectPath(`${entityDir}${entityId}`);
    const objectFile = objectStorageClient.bucket(bucketName).file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) throw new ObjectNotFoundError();
    return objectFile;
  }

  async downloadObject(object: StoredObject, res: Response, cacheTtlSec = 3600) {
    if ("kind" in object) {
      res.set({ "Content-Type": object.contentType, "Content-Length": object.size, "Cache-Control": `public, max-age=${cacheTtlSec}` });
      res.sendFile(object.filePath);
      return;
    }
    const [metadata] = await object.getMetadata();
    const aclPolicy = await getObjectAclPolicy(object);
    res.set({
      "Content-Type": metadata.contentType || "application/octet-stream",
      "Content-Length": metadata.size,
      "Cache-Control": `${aclPolicy?.visibility === "public" ? "public" : "private"}, max-age=${cacheTtlSec}`,
    });
    object.createReadStream().on("error", () => !res.headersSent && res.sendStatus(500)).pipe(res);
  }

  normalizeObjectEntityPath(rawPath: string): string {
    if (!isReplitStorage) {
      const id = localObjectId(rawPath);
      return id ? `/objects/${id}` : rawPath;
    }
    if (!rawPath.startsWith("https://storage.googleapis.com/")) return rawPath;
    const rawObjectPath = new URL(rawPath).pathname;
    const entityDir = `${this.getPrivateObjectDir().replace(/\/$/, "")}/`;
    return rawObjectPath.startsWith(entityDir) ? `/objects/${rawObjectPath.slice(entityDir.length)}` : rawObjectPath;
  }

  async trySetObjectEntityAclPolicy(rawPath: string, aclPolicy: ObjectAclPolicy): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) return normalizedPath;
    const object = await this.getObjectEntityFile(normalizedPath);
    if (!("kind" in object)) await setObjectAclPolicy(object, aclPolicy);
    return normalizedPath;
  }

  async canAccessObjectEntity({ userId, objectFile, requestedPermission }: { userId?: string; objectFile: StoredObject; requestedPermission?: ObjectPermission }): Promise<boolean> {
    return "kind" in objectFile ? true : canAccessObject({ userId, objectFile, requestedPermission: requestedPermission ?? ObjectPermission.READ });
  }
}

async function signObjectURL({ bucketName, objectName, method, ttlSec }: { bucketName: string; objectName: string; method: "GET" | "PUT" | "DELETE" | "HEAD"; ttlSec: number }) {
  const response = await fetch(`${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bucket_name: bucketName, object_name: objectName, method, expires_at: new Date(Date.now() + ttlSec * 1000).toISOString() }),
  });
  if (!response.ok) throw new Error(`Failed to sign object URL (${response.status})`);
  const { signed_url: signedURL } = await response.json();
  return signedURL as string;
}
