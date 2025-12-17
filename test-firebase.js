// Firebase Connection Tes
nst { initializeApp } = require('firebase/app');
const { getFirestore, connectFirestoreEmulator, doc, setDoc, getDoc } = require('firebase/firestore');
const { getAuth, connectAuthEmulator, signInAnonymously } = require('firebase/auth');

const firebaseConfig = {
    apiKey: "AIzaSyBCbE_vyqlFa2v6mk-w3pfQ1qIgYXp0HX4",
    authDomain: "chatus-703ce.firebaseapp.com",
    databaseURL: "https://chatus-703ce-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "chatus-703ce",
    storageBucket: "chatus-703ce.appspot.com",
    messagingSenderId: "924028329830",
    appId: "1:924028329830:web:abfa4a0661401259cbf2a7",
    measurementId: "G-Y27HFQ5150"
};

async function testFirebaseConnection() {
    console.log('🔥 ТЕСТИРОВАНИЕ FIREBASE ПОДКЛЮЧЕНИЯ');
    console.log('='.repeat(50));

    try {
        // Initialize Firebase
        console.log('1. Инициализация Firebase...');
        const app = initializeApp(firebaseConfig);
        console.log('✅ Firebase инициализирован');

        // Initialize Firestore
        console.log('2. Подключение к Firestore...');
        const db = getFirestore(app);
        console.log('✅ Firestore подключен');

        // Initialize Auth
        console.log('3. Подключение к Auth...');
        const auth = getAuth(app);
        console.log('✅ Auth подключен');

        // Test anonymous authentication
        console.log('4. Тестирование анонимной авторизации...');
        const userCredential = await signInAnonymously(auth);
        const user = userCredential.user;
        console.log(`✅ Анонимная авторизация успешна: ${user.uid}`);

        // Test Firestore write
        console.log('5. Тестирование записи в Firestore...');
        const testDoc = doc(db, 'test', 'connection-test');
        await setDoc(testDoc, {
            timestamp: new Date(),
            message: 'Firebase connection test',
            userId: user.uid
        });
        console.log('✅ Запись в Firestore успешна');

        // Test Firestore read
        console.log('6. Тестирование чтения из Firestore...');
        const docSnap = await getDoc(testDoc);
        if (docSnap.exists()) {
            console.log('✅ Чтение из Firestore успешно');
            console.log('   Данные:', docSnap.data());
        } else {
            console.log('❌ Документ не найден');
        }

        console.log('\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!');
        console.log('Firebase полностью функционален');

    } catch (error) {
        console.error('❌ ОШИБКА FIREBASE:', error.message);
        console.error('Детали:', error);
    }
}

// Запуск тестирования
testFirebaseConnection();
