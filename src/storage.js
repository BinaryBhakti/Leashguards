import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { join } from "node:path";

export function createJsonStore(dataDir) {
  const usersPath = join(dataDir, "users.json");
  const sessionsPath = join(dataDir, "sessions.json");
  const reportsPath = join(dataDir, "reports.json");

  return {
    async readUsers() {
      return readJson(usersPath, []);
    },
    async writeUsers(users) {
      return writeJson(dataDir, usersPath, users);
    },
    async readSessions() {
      return readJson(sessionsPath, []);
    },
    async writeSessions(sessions) {
      return writeJson(dataDir, sessionsPath, sessions);
    },
    async readReports() {
      return readJson(reportsPath, []);
    },
    async writeReports(reports) {
      return writeJson(dataDir, reportsPath, reports);
    }
  };
}

async function readJson(path, fallback) {
  try {
    const content = await readFile(path, "utf8");
    return JSON.parse(decodeContent(content));
  } catch (error) {
    return fallback;
  }
}

async function writeJson(dataDir, path, value) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(path, encodeContent(JSON.stringify(value, null, 2)));
}

function encodeContent(content) {
  const key = storageKey();
  if (!key) return content;

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(content, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return JSON.stringify({
    encrypted: true,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: encrypted.toString("base64")
  });
}

function decodeContent(content) {
  const key = storageKey();
  if (!key) return content;

  const payload = JSON.parse(content);
  if (!payload.encrypted) return content;

  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(payload.iv, "base64"));
  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(payload.data, "base64")),
    decipher.final()
  ]).toString("utf8");
}

function storageKey() {
  const value = process.env.LEASHGUARDS_STORAGE_KEY || process.env.LEXGUARD_STORAGE_KEY;
  if (!value) return null;
  return createHash("sha256").update(value).digest();
}
