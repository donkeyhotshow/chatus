import { NextResponse } from 'next/server';
import { telegramStickerService } from '@/lib/telegram/TelegramStickerService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const packs = await telegramStickerService.getAllPacks();
    return NextResponse.json(packs);
  } catch (error) {
    console.error('Failed to fetch sticker packs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
