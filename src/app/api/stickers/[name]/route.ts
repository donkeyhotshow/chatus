import { NextRequest, NextResponse } from 'next/server';
import { telegramStickerService } from '@/lib/telegram/TelegramStickerService';

export async function GET(
  req: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const { name } = params;
    const pack = telegramStickerService.getPack(name);

    if (!pack) {
      return NextResponse.json({ error: 'Sticker pack not found' }, { status: 404 });
    }

    return NextResponse.json(pack);
  } catch (error) {
    console.error('Get pack failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}
