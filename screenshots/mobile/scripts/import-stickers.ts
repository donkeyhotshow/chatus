import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';
const TELEGRAM_FILE_BASE = 'https://api.telegram.org/file/bot';
const token = process.env.TELEGRAM_BOT_TOKEN || '';

interface TelegramSticker {
  file_id: string;
  emoji?: string;
  thumb?: { file_id: string };
}

interface TelegramStickerSet {
  name: string;
  title: string;
  stickers: TelegramSticker[];
}

async function fetchStickerSet(name: string): Promise<TelegramStickerSet> {
  const response = await fetch(`${TELEGRAM_API_BASE}${token}/getStickerSet?name=${name}`);
  const data = await response.json();
  if (!data.ok) throw new Error(`Failed to fetch sticker set: ${data.description}`);
  return data.result;
}

async function getFileUrl(fileId: string): Promise<string> {
  const response = await fetch(`${TELEGRAM_API_BASE}${token}/getFile?file_id=${fileId}`);
  const data = await response.json();
  if (!data.ok) throw new Error(`Failed to get file: ${data.description}`);
  return `${TELEGRAM_FILE_BASE}${token}/${data.result.file_path}`;
}

async function main() {
  const url = process.argv[2] || 'https://t.me/addstickers/jjaba';
  const match = url.match(/addstickers\/([a-zA-Z0-9_]+)/);
  if (!match) {
    console.error('❌ Invalid sticker URL');
    process.exit(1);
  }

  const shortName = match[1];
  console.log(`📦 Импорт стикерпака: ${shortName}`);

  const stickerSet = await fetchStickerSet(shortName);
  console.log(`   Название: ${stickerSet.title}`);
  console.log(`   Всего стикеров: ${stickerSet.stickers.length}`);

  const stickers: { fileId: string; localPath: string; emoji?: string }[] = [];
  const toProcess = stickerSet.stickers.slice(0, 30);

  for (let i = 0; i < toProcess.length; i++) {
    const sticker = toProcess[i];
    try {
      process.stdout.write(`   Получение URL ${i + 1}/${toProcess.length}...\r`);
      const stickerUrl = await getFileUrl(sticker.file_id);
      stickers.push({
        fileId: sticker.file_id,
        localPath: stickerUrl,
        emoji: sticker.emoji
      });
    } catch (err) {
      console.error(`\n   ⚠️ Ошибка стикера ${i}:`, (err as Error).message);
    }
  }

  const pack = {
    shortName: stickerSet.name,
    title: stickerSet.title,
    stickerCount: stickers.length,
    stickers
  };

  await admin.firestore().collection('stickerPacks').doc(pack.shortName).set(pack);

  console.log(`\n✅ Импортировано: ${pack.title}`);
  console.log(`   Стикеров: ${pack.stickerCount}`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Ошибка:', err);
  process.exit(1);
});
