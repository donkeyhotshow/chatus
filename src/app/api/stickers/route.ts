import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Lazy import to avoid initialization errors
    const { telegramStickerService } = await import('@/lib/telegram/TelegramStickerService');
    const packs = await telegramStickerService.getAllPacks();
    return NextResponse.json(packs);
  } catch (error) {
    console.error('Failed to fetch sticker packs:', error);
    // Return empty array instead of error to prevent UI crash
    return NextResponse.json([]);
  }
}
