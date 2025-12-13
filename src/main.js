import { ref, set, get, push, onValue } from "firebase/database";
import { db, auth } from "./firebase.js";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";

// Записать простой объект в путь /test/hello
export async function writeTest() {
  await set(ref(db, "test/hello"), { text: "hello world", ts: Date.now() });
  console.log("Запись выполнена: /test/hello");
}

// Прочитать значение
export async function readTest() {
  const snapshot = await get(ref(db, "test/hello"));
  if (snapshot.exists()) {
    console.log("Прочитанные данные:", snapshot.val());
  } else {
    console.log("Нет данных в /test/hello");
  }
}

// Записать с push (для списка)
export async function pushMessage(obj) {
  const newRef = push(ref(db, "messages"));
  await set(newRef, { ...obj, ts: Date.now() });
  console.log("Сообщение добавлено по пути:", newRef.key);
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
        console.log("Signed in anonymously for smoke test (dev).");
      } catch (e) {
        console.warn("Anonymous sign-in failed (may already be signed in):", e);
      }
    }

    await writeTest();
    await readTest();
    subscribeMessages((v) => {
      console.log("Подписка /messages обновлена:", v);
    });
  } catch (err) {
    console.error("Ошибка при тесте RTDB:", err);
  }
}

// Экспортируем функции также в window для отладки из консоли
window.writeTest = writeTest;
window.readTest = readTest;
window.pushMessage = pushMessage;
window.subscribeMessages = subscribeMessages;

runSmokeTest();


