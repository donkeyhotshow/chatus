import { useEffect, useRef, useState } from 'react';
import { doc, collection, onSnapshot, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useFirebase } from '@/components/firebase/FirebaseProvider';

function throttle<T extends (...args: unknown[]) => void>(fn: T, wait: number) {
  let last = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = wait - (now - last);
    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      last = now;
      fn(...args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        last = Date.now();
        timeout = null;
        fn(...args);
      }, remaining);
    }
  };
}

interface CursorPosition {
  x: number;
  y: number;
  color: string;
  name: string;
  timestamp?: Timestamp; // Firestore Timestamp
}

interface User {
  uid: string;
  displayName?: string;
  cursorColor?: string;
}

interface CollaborativeCanvasProps {
  roomId: string;
  canvasId?: string;
}

export function CollaborativeCanvas({ roomId }: CollaborativeCanvasProps) {
  const { firestore, user } = useFirebase();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  const [users, setUsers] = useState<User[]>([]);

  // Отправляем позицию своего курсора (throttled)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !user || !firestore) return;

    const handleMouseMove = throttle((e: MouseEvent) => {
      if (!canvas || !user || !firestore) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      void setDoc(doc(firestore!, `rooms/${roomId}/cursors/${user.uid}`), {
        x,
        y,
        color: (user as { cursorColor?: string }).cursorColor || '#000000',
        name: user.displayName || 'Anonymous',
        timestamp: serverTimestamp(),
      }, { merge: true });
    }, 50);

    canvas.addEventListener('mousemove', handleMouseMove);
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      // Optionally remove cursor on unmount: deleteDoc(doc(firestore, `rooms/${roomId}/cursors/${user.uid}`))
    };
  }, [roomId, user, firestore]);

  // Слушаем курсоры других пользователей
  useEffect(() => {
    if (!firestore) return;
    const cursorsRef = collection(firestore, `rooms/${roomId}/cursors`);
    const unsubscribe = onSnapshot(cursorsRef, (snapshot) => {
      const newCursors = new Map<string, CursorPosition>();
      const newUsers: User[] = [];
      snapshot.docs.forEach((d) => {
        const data = d.data() as CursorPosition;
        newCursors.set(d.id, data);
        newUsers.push({ uid: d.id, displayName: data.name, cursorColor: data.color });
      });
      setCursors(newCursors);
      setUsers(newUsers);
    });
    return () => unsubscribe();
  }, [roomId, firestore]);

  return (
    <div className="relative w-full h-full border border-gray-300 rounded-lg overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" width={800} height={600} />

      {/* Render other cursors */}
      {Array.from(cursors.entries()).map(([userId, cursor]) => (
        <div
          key={userId}
          className="absolute pointer-events-none transition-all duration-50"
          style={{
            left: cursor.x,
            top: cursor.y,
            color: cursor.color,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" fill={cursor.color} stroke="white" strokeWidth="1" />
          </svg>
          <span className="ml-6 bg-black text-white px-2 py-1 rounded text-sm whitespace-nowrap">{cursor.name}</span>
        </div>
      ))}

      {/* Online users list */}
      <div className="absolute top-2 right-2 bg-white rounded-lg shadow-lg p-2">
        <h4 className="text-sm font-bold mb-1">Drawing ({users.length})</h4>
        {users.map((u) => (
          <div key={u.uid} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: u.cursorColor || '#ccc' }} />
            {u.displayName || u.uid}
          </div>
        ))}
      </div>
    </div>
  );
}
