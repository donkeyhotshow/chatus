/**
 * RTDB emulator rules test
 *
 * Usage:
 * 1. Start emulators:
 *    firebase emulators:start --only database,auth
 * 2. Run this script:
 *    node tests/emulator/rtdb-emulator-test.mjs
 *
 * Requires Node 18+ (global fetch available).
 */

const PROJECT_ID = "studio-5170287541-f2fb7";
const AUTH_EMULATOR_URL = "http://localhost:9099";
const DB_EMULATOR_URL = "http://localhost:9000";

function log(...args) { console.log("[rtdb-test]", ...args); }

async function anonSignUp() {
  log("Signing up anonymously against Auth emulator...");
  const res = await fetch(`${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnSecureToken: true })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Auth signUp failed: ${res.status} ${JSON.stringify(data)}`);
  log("Signed up:", data.localId);
  return { idToken: data.idToken, localId: data.localId };
}

async function putValue(path, idToken, body) {
  const url = `${DB_EMULATOR_URL}/${path}.json?ns=${PROJECT_ID}${idToken ? "&auth=" + idToken : ""}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

async function getValue(path, idToken) {
  const url = `${DB_EMULATOR_URL}/${path}.json?ns=${PROJECT_ID}${idToken ? "&auth=" + idToken : ""}`;
  const res = await fetch(url);
  return { status: res.status, body: await res.text() };
}

async function run() {
  try {
    const { idToken, localId } = await anonSignUp();

    // 1) Valid write (should succeed)
    const valid = { text: "hello emulator", ts: Date.now(), senderId: localId };
    const ok1 = await putValue("messages/test-valid", idToken, valid);
    log("Valid write status:", ok1.status, ok1.body);
    if (ok1.status >= 200 && ok1.status < 300) {
      log("Valid write succeeded (expected).");
    } else {
      throw new Error("Valid write failed unexpectedly.");
    }

    // 2) Invalid write (senderId mismatch) - should be rejected
    const invalid = { text: "invalid sender", ts: Date.now(), senderId: "someone-else" };
    const ok2 = await putValue("messages/test-invalid", idToken, invalid);
    log("Invalid write status:", ok2.status, ok2.body);
    if (ok2.status === 401 || ok2.status === 403) {
      log("Invalid write correctly rejected (expected).");
    } else {
      throw new Error("Invalid write was NOT rejected by rules.");
    }

    // 3) Read with auth (should succeed)
    const readAuth = await getValue("messages/test-valid", idToken);
    log("Read with auth status:", readAuth.status, readAuth.body);
    if (readAuth.status >= 200 && readAuth.status < 300) {
      log("Read with auth succeeded (expected).");
    } else {
      throw new Error("Read with auth failed unexpectedly.");
    }

    // 4) Read without auth (should be rejected)
    const readNoAuth = await getValue("messages/test-valid", null);
    log("Read without auth status:", readNoAuth.status, readNoAuth.body);
    if (readNoAuth.status === 401 || readNoAuth.status === 403) {
      log("Read without auth correctly rejected (expected).");
    } else {
      throw new Error("Read without auth was NOT rejected by rules.");
    }

    log("All tests completed.");
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(2);
  }
}

run();


