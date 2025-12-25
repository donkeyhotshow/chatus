import { NextRequest, NextResponse } from 'next/server';
import { telegramStickerService } from '@/lib/telegram/TelegramStickerService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    if (!process.env.TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({ error: 'Telegram Bot Token not configured' }, { status: 500 });
    }

    const pack = await telegramStickerService.importStickerPack(url);

    return NextResponse.json({ success: true, pack });
  } catch (error) {
    console.error('Import failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
