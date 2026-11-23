import axios from "axios";

const DB_NAME = "msl-desktop-cache";
const STORE = "responses";
const DB_VERSION = 1;
const MAX_ENTRY_CHARS = 20_000_000;
const MAX_KEEP_MS = 7 * 24 * 60 * 60 * 1000;
const MIN = 60 * 1000;
const HOUR = 60 * MIN;

const SECRET_KEYS = new Set([
  "token",
  "refreshToken",
  "refresh_token",
  "password",
  "authorization",
  "accessToken",
  "access_token",
]);

const listeners = new Set();
const memory = new Map();
const inflight = new Map();
let dbPromise = null;

const RULES = [
  {
    test: (path) => path === "/v2/course" || path === "/v2/course/",
    fresh: 15 * MIN,
    swr: 12 * HOUR,
  },
  {
    test: (path) => path === "/v2/course/user-courses",
    fresh: 5 * MIN,
    swr: 6 * HOUR,
  },
  {
    test: (path) => path === "/v2/course/user-with-quizzes",
    fresh: 5 * MIN,
    swr: 6 * HOUR,
  },
  {
    test: (path) =>
      /^\/v2\/course\/(?!user-courses$|user-with-quizzes$)[^/]+$/.test(path),
    fresh: 10 * MIN,
    swr: 12 * HOUR,
  },
  {
    test: (path) => /^\/v2\/quiz\/by-course\//.test(path),
    fresh: 5 * MIN,
    swr: 6 * HOUR,
  },
  {
    test: (path) =>
      /^\/v2\/quiz\/(?!quiz-response$|by-course$)[^/]+$/.test(path),
    fresh: 10 * MIN,
    swr: 12 * HOUR,
  },
  {
    test: (path) => path === "/v2/flashcard/user-with-flashcards",
    fresh: 5 * MIN,
    swr: 6 * HOUR,
  },
  {
    test: (path) => /^\/v2\/flashcard\/by-course\//.test(path),
    fresh: 5 * MIN,
    swr: 6 * HOUR,
  },
  {
    test: (path) => /^\/v2\/flashcard\/[^/]+\/leaderboard$/.test(path),
    fresh: 2 * MIN,
    swr: 30 * MIN,
  },
  {
    test: (path) =>
      /^\/v2\/flashcard\/(?!user-with-flashcards$|by-course$)[^/]+$/.test(path),
    fresh: 10 * MIN,
    swr: 12 * HOUR,
  },
  {
    test: (path) => path === "/v2/gamification/me",
    fresh: 2 * MIN,
    swr: 30 * MIN,
  },
  {
    test: (path) => path === "/v2/gamification/leaderboard",
    fresh: 2 * MIN,
    swr: 30 * MIN,
  },
  {
    test: (path) => path === "/v2/user/profile",
    fresh: 5 * MIN,
    swr: HOUR,
  },
  {
    test: (path) => path === "/v2/subscription/plan",
    fresh: 30 * MIN,
    swr: 24 * HOUR,
    shared: true,
  },
  {
    test: (path) => path === "/v2/subscription/status",
    fresh: MIN,
    swr: 0,
  },
  {
    test: (path) =>
      path === "/v2/subscription/resources" ||
      /^\/v2\/subscription\/resources\/[^/]+$/.test(path),
    fresh: 10 * MIN,
    swr: 6 * HOUR,
  },
  {
    test: pastQuestionCacheable,
    fresh: 15 * MIN,
    swr: 12 * HOUR,
  },
];

function pastQuestionCacheable(path) {
  if (path === "/v2/past-questions") return true;
  const match = path.match(/^\/v2\/past-questions\/([^/]+)(?:\/([^/]+))?$/);
  if (!match) return false;
  if (match[1] === "chat" || match[1] === "ai-quota" || match[1] === "history") {
    return false;
  }
  if (!match[2]) return true;
  return match[2] === "insights";
}

function matchRule(path) {
  return RULES.find((rule) => rule.test(path)) || null;
}

function resolveUrl(config) {
  const raw = config.url || "";
  const base = config.baseURL || "";
  const url = /^https?:\/\//i.test(raw)
    ? new URL(raw)
    : new URL(raw.replace(/^\//, ""), base.endsWith("/") ? base : `${base}/`);
  if (config.params && typeof config.params === "object") {
    for (const [key, value] of Object.entries(config.params)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}

function identityOf(config) {
  const url = resolveUrl(config);
  const params = [...url.searchParams.entries()].sort(([a], [b]) =>
    a.localeCompare(b)
  );
  return {
    path: url.pathname,
    paramsKey: params.map(([key, value]) => `${key}=${value}`).join("&"),
  };
}

function stripSecrets(value) {
  if (Array.isArray(value)) return value.map(stripSecrets);
  if (!value || typeof value !== "object") return value;
  const copy = {};
  for (const [key, nested] of Object.entries(value)) {
    if (SECRET_KEYS.has(key)) continue;
    copy[key] = stripSecrets(nested);
  }
  return copy;
}

function cloneForCache(data) {
  const parsed = typeof data === "string" ? JSON.parse(data) : data;
  const json = JSON.stringify(parsed);
  if (!json || json.length > MAX_ENTRY_CHARS) return null;
  return stripSecrets(JSON.parse(json));
}

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "key" });
        store.createIndex("savedAt", "savedAt");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

async function idbGet(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function idbPut(entry) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readwrite").objectStore(STORE).put(entry);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function idbClear() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readwrite").objectStore(STORE).clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function idbDeleteMatching(predicate) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const request = store.openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      if (predicate(cursor.value)) cursor.delete();
      cursor.continue();
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function pruneOldEntries() {
  const cutoff = Date.now() - MAX_KEEP_MS;
  await idbDeleteMatching((entry) => entry.savedAt < cutoff).catch(() => {});
}

let pruned = false;
function pruneOnce() {
  if (pruned) return;
  pruned = true;
  pruneOldEntries().catch(() => {});
}

function emit(info) {
  queueMicrotask(() => {
    for (const listener of [...listeners]) {
      try {
        listener(info);
      } catch (error) {
        console.error(error);
      }
    }
  });
}

export function onResponseCacheUpdate(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function clearResponseCache() {
  memory.clear();
  inflight.clear();
  idbClear().catch(() => {});
}

export function invalidateResponseCache(pathFragment) {
  const fragment = String(pathFragment || "");
  if (!fragment) return;
  for (const [key, entry] of memory) {
    if (entry.path && entry.path.includes(fragment)) memory.delete(key);
  }
  idbDeleteMatching((entry) => entry.path && entry.path.includes(fragment)).catch(
    () => {}
  );
  emit({ path: fragment, invalidated: true });
}

async function readEntry(key) {
  const cached = memory.get(key);
  if (cached) return cached;
  try {
    const stored = await idbGet(key);
    if (!stored) return null;
    if (Date.now() - stored.savedAt > MAX_KEEP_MS) return null;
    memory.set(key, stored);
    return stored;
  } catch {
    return null;
  }
}

async function writeEntry(key, entry, { notify }) {
  memory.set(key, entry);
  try {
    await idbPut(entry);
  } catch {
    // Memory copy still serves this session if IndexedDB is full or unavailable.
  }
  if (notify) emit({ path: entry.path, key });
}

function asResponse(config, entry) {
  return {
    data: entry.data,
    status: entry.status,
    statusText: "OK",
    headers: {},
    config,
    request: null,
    cached: true,
  };
}

function transportFor() {
  if (typeof axios.getAdapter === "function") {
    return axios.getAdapter(axios.defaults.adapter);
  }
  return axios.defaults.adapter;
}

const transport = transportFor();

function scopeFor(rule, getUserScope) {
  if (rule.shared) return "public";
  const scope = getUserScope();
  return scope ? String(scope) : null;
}

export function attachResponseCache(client, getUserScope) {
  client.defaults.adapter = async (config) => {
    const method = String(config.method || "get").toLowerCase();
    const skip =
      config.mslCache === false ||
      method !== "get" ||
      (config.responseType &&
        config.responseType !== "json" &&
        config.responseType !== "text");
    if (skip) return transport(config);

    let identity;
    try {
      identity = identityOf(config);
    } catch {
      return transport(config);
    }
    const rule = matchRule(identity.path);
    if (!rule) return transport(config);
    const scope = scopeFor(rule, getUserScope);
    if (!scope) return transport(config);

    pruneOnce();
    const key = `${scope}|GET|${identity.path}|${identity.paramsKey}`;
    const entry = await readEntry(key);
    const age = entry ? Date.now() - entry.savedAt : Infinity;

    if (entry && age < rule.fresh) {
      return asResponse(config, entry);
    }

    if (entry && age < rule.fresh + rule.swr) {
      revalidate(config, key, identity.path, scope);
      return asResponse(config, entry);
    }

    try {
      return await fetchAndStore(config, key, identity.path, scope, false);
    } catch (error) {
      if (entry) return asResponse(config, entry);
      throw error;
    }
  };
}

function revalidate(config, key, path, scope) {
  fetchAndStore(config, key, path, scope, true).catch(() => {});
}

async function fetchAndStore(config, key, path, scope, notify) {
  const existing = inflight.get(key);
  if (existing) return existing;
  const run = transport(config).then(async (response) => {
    try {
      if (response && (response.status === 200 || response.status === 201)) {
        const data = cloneForCache(response.data);
        if (data) {
          await writeEntry(
            key,
            {
              key,
              scope,
              path,
              savedAt: Date.now(),
              status: response.status,
              data,
            },
            { notify }
          );
        }
      }
    } catch {
      // The screen still gets the network response if the body cannot be stored.
    }
    return response;
  });
  inflight.set(key, run);
  run.finally(() => {
    if (inflight.get(key) === run) inflight.delete(key);
  });
  return run;
}
