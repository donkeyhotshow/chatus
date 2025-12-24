import path from 'path';
import { adminStorage, adminDb } from '../firebase-admin';
import { TelegramStickerSet, TelegramFile, StickerPack } from './types';

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';
const TELEGRAM_FILE_BASE = 'https://api.telegram.org/file/bot';

export class TelegramStickerService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private get apiUrl(): string {
    return `${TELEGRAM_API_BASE}${this.token}`;
  }

  private get fileUrl(): string {
    return `${TELEGRAM_FILE_BASE}${this.token}`;
  }

  public extractShortName(url: string): string | null {
    const regex = /https?:\/\/(?:t\.me|telegram\.me)\/addstickers\/([a-zA-Z0-9_]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  public async fetchStickerSet(name: string): Promise<TelegramStickerSet> {
    const response = await fetch(`${this.apiUrl}/getStickerSet?name=${name}`);
    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Failed to fetch sticker set: ${data.description}`);
    }

    return data.result as TelegramStickerSet;
  }

  public async getFile(fileId: string): Promise<TelegramFile> {
    const response = await fetch(`${this.apiUrl}/getFile?file_id=${fileId}`);
    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Failed to get file info: ${data.description}`);
    }

    return data.result as TelegramFile;
  }

  /**
   * Downloads a sticker file and saves it to Firebase Storage
   */
  public async downloadStickerToStorage(fileId: string, packName: string, fileName: string): Promise<string> {
    const fileInfo = await this.getFile(fileId);
    
    if (!fileInfo.file_path) {
      throw new Error('File path not found in Telegram response');
    }

    const downloadUrl = `${this.fileUrl}/${fileInfo.file_path}`;
    const response = await fetch(downloadUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Determine extension
    const ext = path.extname(fileInfo.file_path) || '.webp';
    const storagePath = `stickers/${packName}/${fileName}${ext}`;
    
    const bucket = adminStorage.bucket();
    const file = bucket.file(storagePath);

    await file.save(buffer, {
      metadata: {
        contentType: ext === '.webp' ? 'image/webp' : 'image/png',
      },
      public: true
    });

    // Return public URL
    return `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
  }

  public async importStickerPack(url: string): Promise<StickerPack> {
    const shortName = this.extractShortName(url);
    if (!shortName) {
      throw new Error('Invalid sticker pack URL');
    }

    const stickerSet = await this.fetchStickerSet(shortName);
    const stickers: StickerPack['stickers'] = [];

    // Limit to first 30 stickers
    const stickersToProcess = stickerSet.stickers.slice(0, 30);

    for (let i = 0; i < stickersToProcess.length; i++) {
      const sticker = stickersToProcess[i];
      try {
        const publicUrl = await this.downloadStickerToStorage(
          sticker.file_id, 
          shortName, 
          `sticker_${i}`
        );
        
        stickers.push({
          fileId: sticker.file_id,
          localPath: publicUrl, // Now it's a storage URL
          emoji: sticker.emoji
        });
      } catch (err) {
        console.error(`Failed to download sticker ${i}:`, err);
      }
    }

    const pack: StickerPack = {
      shortName: stickerSet.name,
      title: stickerSet.title,
      stickerCount: stickers.length,
      stickers
    };

    // Save metadata to Firestore
    await adminDb.collection('stickerPacks').doc(pack.shortName).set(pack);

    return pack;
  }

  public async getPack(shortName: string): Promise<StickerPack | null> {
    const doc = await adminDb.collection('stickerPacks').doc(shortName).get();
    if (!doc.exists) return null;
    return doc.data() as StickerPack;
  }

  public async getAllPacks(): Promise<StickerPack[]> {
    const snapshot = await adminDb.collection('stickerPacks').get();
    return snapshot.docs.map(doc => doc.data() as StickerPack);
  }
}

export const telegramStickerService = new TelegramStickerService(
  process.env.TELEGRAM_BOT_TOKEN || ''
);
