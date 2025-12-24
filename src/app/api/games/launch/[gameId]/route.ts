import { NextRequest, NextResponse } from 'next/server';
import { gameLauncherService } from '@/lib/games/GameLauncherService';
import { GameId } from '@/lib/games/types/game';

export async function POST(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const { roomId, players } = await request.json();
    const gameId = params.gameId as GameId;

    if (!roomId) {
      return NextResponse.json({ error: 'roomId is required' }, { status: 400 });
    }

    const session = await gameLauncherService.launchGame(gameId, roomId, players || []);

    return NextResponse.json(session);
  } catch (error) {
    console.error('Failed to launch game:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
