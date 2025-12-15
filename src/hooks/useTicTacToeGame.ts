import { useEffect, useState } from 'react';
import { doc, onSnapshot, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useFirebase } from '@/components/firebase/FirebaseProvider';

interface TicTacToeState {
  id: string;
  board: (string | null)[][];
  currentTurn: 'player1' | 'player2';
  players: {
    player1: { uid: string; symbol: 'X' | 'O'; connected: boolean; lastSeen: number };
    player2: { uid: string; symbol: 'X' | 'O'; connected: boolean; lastSeen: number };
  };
  status: 'waiting' | 'in_progress' | 'finished';
  winner: string | null;
  moveCount: number;
  lastMoveTime?: number;
  createdAt?: number;
}

export function useTicTacToeGame(roomId: string, gameId: string) {
  const { firestore, user } = useFirebase();
  const [game, setGame] = useState<TicTacToeState | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [connectionLost, setConnectionLost] = useState(false);

  useEffect(() => {
    if (!firestore) return;
    const gameRef = doc(firestore, `rooms/${roomId}/games/${gameId}`);

    // Слухаємо зміни гри в реальному часі
    const unsubscribe = onSnapshot(
      gameRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setGame({ id: snapshot.id, ...snapshot.data() } as TicTacToeState);
          setConnectionLost(false);
          setReconnecting(false);
        }
      },
      () => {
        // Connection lost - attempt reconnect
        setConnectionLost(true);
        attemptReconnect();
      }
    );

    return () => unsubscribe();
  }, [roomId, gameId, user, firestore, attemptReconnect]);

  const attemptReconnect = async () => {
    setReconnecting(true);

    try {
      // Отримуємо поточний стан гри з сервера
      if (!firestore) return;
      const gameRef = doc(firestore, `rooms/${roomId}/games/${gameId}`);
      const gameSnap = await getDoc(gameRef);

      if (gameSnap.exists()) {
        setGame({ id: gameSnap.id, ...gameSnap.data() } as TicTacToeState);

        // Оновлюємо статус підключення гравця
        if (user) {
          const playerKey = gameSnap.data().players.player1.uid === user.uid ? 'player1' : 'player2';
          await updateDoc(gameRef, {
            [`players.${playerKey}.connected`]: true,
            [`players.${playerKey}.lastSeen`]: serverTimestamp()
          });
        }

        setConnectionLost(false);
      }
    } catch {
      // Reconnect failed - retry in 3 seconds
      setTimeout(attemptReconnect, 3000);
    } finally {
      setReconnecting(false);
    }
  };

  return { game, reconnecting, connectionLost };
}
