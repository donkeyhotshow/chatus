import { useEffect, useState } from 'react';
import { doc, onSnapshot, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useFirebase } from '@/components/firebase/FirebaseProvider';

interface TicTacToeState {
  id: string;
  board: (string | null)[][];
  currentTurn: 'player1' | 'player2';
  players: {
    player1: { uid: string; symbol: 'X' | 'O'; connected: boolean; lastSeen: any };
    player2: { uid: string; symbol: 'X' | 'O'; connected: boolean; lastSeen: any };
  };
  status: 'waiting' | 'in_progress' | 'finished';
  winner: string | null;
  moveCount: number;
  lastMoveTime?: any;
  createdAt?: any;
}

export function useTicTacToeGame(roomId: string, gameId: string) {
  const { firestore, user } = useFirebase();
  const [game, setGame] = useState<TicTacToeState | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [connectionLost, setConnectionLost] = useState(false);
  
  useEffect(() => {
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
      (error) => {
        console.error('Connection lost:', error);
        setConnectionLost(true);
        
        // Спроба reconnect
        attemptReconnect();
      }
    );
    
    return () => unsubscribe();
  }, [roomId, gameId, user]);
  
  const attemptReconnect = async () => {
    setReconnecting(true);
    
    try {
      // Отримуємо поточний стан гри з сервера
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
    } catch (error) {
      console.error('Reconnect failed:', error);
      
      // Retry через 3 секунди
      setTimeout(attemptReconnect, 3000);
    } finally {
      setReconnecting(false);
    }
  };
  
  return { game, reconnecting, connectionLost };
}
