import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const sessionTtlMs = 1000 * 60 * 60 * 12;

export function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
  };
}

export async function registerUser(store, { name, email, password }) {
  const cleanEmail = normalizeEmail(email);
  validatePassword(password);

  const users = await store.readUsers();
  if (users.some((user) => user.email === cleanEmail)) {
    throw new Error("A user with this email already exists.");
  }

  const user = {
    id: `user-${Date.now()}-${randomBytes(4).toString("hex")}`,
    name: String(name || "Leashguards User").trim().slice(0, 80),
    email: cleanEmail,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };

  await store.writeUsers([user, ...users]);
  return publicUser(user);
}

export async function loginUser(store, { email, password }) {
  const users = await store.readUsers();
  const user = users.find((item) => item.email === normalizeEmail(email));

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new Error("Invalid email or password.");
  }

  const session = {
    token: randomBytes(32).toString("hex"),
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + sessionTtlMs).toISOString()
  };
  const sessions = await store.readSessions();
  await store.writeSessions([session, ...sessions.filter((item) => new Date(item.expiresAt).getTime() > Date.now())]);

  return {
    token: session.token,
    user: publicUser(user)
  };
}

export async function authenticateRequest(store, request) {
  const token = parseAuthToken(request);
  if (!token) return null;

  const sessions = await store.readSessions();
  const session = sessions.find((item) => item.token === token && new Date(item.expiresAt).getTime() > Date.now());
  if (!session) return null;

  const users = await store.readUsers();
  const user = users.find((item) => item.id === session.userId);
  return user ? publicUser(user) : null;
}

export function parseAuthToken(request) {
  const header = request.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7);

  const cookie = request.headers.cookie || "";
  const match = cookie.match(/leashguards_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${key}`;
}

function verifyPassword(password, stored) {
  const [salt, key] = String(stored || "").split(":");
  if (!salt || !key) return false;

  const actual = Buffer.from(scryptSync(password, salt, 64).toString("hex"));
  const expected = Buffer.from(key);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function normalizeEmail(email) {
  const clean = String(email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    throw new Error("A valid email is required.");
  }
  return clean;
}

function validatePassword(password) {
  if (String(password || "").length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
}

