import { ref, set, get, push, onValue } from "firebase/database";
import { db, auth } from "./firebase.js";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { logger } from './lib/logger.js';

// Записать простой объект в путь /test/hello
export async function writeTest() {
  await set(ref(db, "test/hello"), { text: "hello world", ts: Date.now() });
  logger.debug("Запись выполнена: /test/hello");
}

// Прочитать значение
export async function readTest() {
  const snapshot = await get(ref(db, "test/hello"));
  if (snapshot.exists()) {
    logger.debug("Прочитанные данные:", { data: snapshot.val() });
  } else {
    logger.debug("Нет данных в /test/hello");
  }
}

// Записать с push (для списка)
export async function pushMessage(obj) {
  const newRef = push(ref(db, "messages"));
  await set(newRef, { ...obj, ts: Date.now() });
  logger.debug("Сообщение добавлено по пути:", { key: newRef.key });
}

// Подписка на изменения в /messages
export function subscribeMessages(callback) {
  const messagesRef = ref(db, "messages");
  return onValue(messagesRef, (snapshot) => {
    const value = snapshot.val();
    callback(value);
  });
}

// Для удобства: запуск простого теста при загрузке страницы
async function runSmokeTest() {
  try {
    // Ensure we are authenticated in dev before attempting writes (rules require auth != null).
    if (auth) {
      try {
        await signInAnonymously(auth);
        logger.debug("Signed in anonymously for smoke test (dev)");
      } catch (e) {
        logger.warn("Anonymous sign-in failed (may already be signed in)", { error: e });
      }
    }

    await writeTest();
    await readTest();
    subscribeMessages((v) => {
      logger.debug("Подписка /messages обновлена:", { value: v });
    });
  } catch (err) {
    logger.error("Ошибка при тесте RTDB", err);
  }
}

// Экспортируем функции также в window для отладки из консоли
window.writeTest = writeTest;
window.readTest = readTest;
window.pushMessage = pushMessage;
window.subscribeMessages = subscribeMessages;

runSmokeTest();


