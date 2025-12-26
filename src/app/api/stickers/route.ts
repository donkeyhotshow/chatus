import { NextResponse } from 'next/server';
import staticStickers from '@/lib/stickers.json';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // First, return static packs (always available)
    const staticPacks = staticStickers.packs || [];

    // Try to get additional packs from Firestore
    try {
      const { telegramStickerService } = await import('@/lib/telegram/TelegramStickerService');
      const firestorePacks = await telegramStickerService.getAllPacks();

      // Merge: static packs first, then firestore packs (avoiding duplicates)
      const staticShortNames = new Set(staticPacks.map(p => p.shortName));
      const uniqueFirestorePacks = firestorePacks.filter(p => !staticShortNames.has(p.shortName));

      return NextResponse.json([...staticPacks, ...uniqueFirestorePacks]);
    } catch {
      // If Firestore fails, just return static packs
      return NextResponse.json(staticPacks);
    }
  } catch (error) {
    console.error('Failed to fetch sticker packs:', error);
    return NextResponse.json([]);
  }
}
