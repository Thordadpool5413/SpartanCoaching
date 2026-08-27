type RoleplayMessage = {
  role: "user" | "character";
  content: string;
};

export type EphemeralRoleplaySession = {
  id: number;
  memberId: number;
  organizationId: number;
  scenarioId: string;
  scenarioTitle: string;
  scenarioDescription: string | null;
  status: "active" | "completed";
  feedback: string | null;
  rating: number | null;
  createdAt: number;
  messages: RoleplayMessage[];
  lastTouchedAt: number;
};

const SESSION_TTL_MS = 30 * 60 * 1000;
const MAX_SESSIONS = 250;
const sessions = new Map<number, EphemeralRoleplaySession>();
let nextId = Date.now();

function evictExpiredSessions(now = Date.now()) {
  for (const [id, session] of sessions) {
    if (now - session.lastTouchedAt > SESSION_TTL_MS) sessions.delete(id);
  }
  while (sessions.size > MAX_SESSIONS) {
    const oldest = sessions.keys().next().value;
    if (oldest === undefined) break;
    sessions.delete(oldest);
  }
}

export function createEphemeralRoleplaySession(input: Omit<EphemeralRoleplaySession, "id" | "createdAt" | "feedback" | "rating" | "messages" | "lastTouchedAt">) {
  evictExpiredSessions();
  const now = Date.now();
  const session: EphemeralRoleplaySession = {
    ...input,
    id: ++nextId,
    createdAt: now,
    feedback: null,
    rating: null,
    messages: [],
    lastTouchedAt: now,
  };
  sessions.set(session.id, session);
  return session;
}

export function getEphemeralRoleplaySession(id: number, memberId: number, organizationId: number) {
  evictExpiredSessions();
  const session = sessions.get(id);
  if (!session || session.memberId !== memberId || session.organizationId !== organizationId) return undefined;
  session.lastTouchedAt = Date.now();
  return session;
}

export function appendEphemeralRoleplayMessage(
  session: EphemeralRoleplaySession,
  message: RoleplayMessage,
) {
  session.messages.push(message);
  session.lastTouchedAt = Date.now();
}

export function finishEphemeralRoleplaySession(
  session: EphemeralRoleplaySession,
  feedback: string,
  rating: number,
) {
  const completed = { ...session, status: "completed" as const, feedback, rating };
  sessions.delete(session.id);
  return completed;
}

export function clearEphemeralRoleplaySessionsForTest() {
  sessions.clear();
}