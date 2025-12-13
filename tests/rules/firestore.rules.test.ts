import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  clearFirestoreData,
} from '@firebase/rules-unit-testing';
import fs from 'fs';
import path from 'path';
import { doc, setDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

const hasEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;
const describeIf = hasEmulator ? describe : describe.skip;

const projectId = 'chatforus-test';
let testEnv: RulesTestEnvironment;

if (hasEmulator) {
  beforeAll(async () => {
    const rules = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8');
    testEnv = await initializeTestEnvironment({
      projectId,
      firestore: { rules },
    });
  });
  
  afterAll(async () => {
    await testEnv.cleanup();
  });
  
  beforeEach(async () => {
    await clearFirestoreData({ projectId });
  });
}

describeIf('Firestore rules - participants', () => {
  it('allows a user to join by adding only themselves', async () => {
    const adminDb = testEnv.withSecurityRulesDisabled().firestore();
    await setDoc(doc(adminDb, 'rooms', 'room-join'), {
      participants: ['u1'],
      participantProfiles: [{ id: 'u1', name: 'U1', avatar: '' }],
      typing: [],
    });

    const user2Db = testEnv.authenticatedContext('u2').firestore();
    await assertSucceeds(
      updateDoc(doc(user2Db, 'rooms', 'room-join'), {
        participants: ['u1', 'u2'],
        participantProfiles: [
          { id: 'u1', name: 'U1', avatar: '' },
          { id: 'u2', name: 'U2', avatar: '' },
        ],
      }),
    );
  });

  it('allows a user to leave only themselves', async () => {
    const adminDb = testEnv.withSecurityRulesDisabled().firestore();
    await setDoc(doc(adminDb, 'rooms', 'room-leave'), {
      participants: ['u1', 'u2'],
      participantProfiles: [
        { id: 'u1', name: 'U1', avatar: '' },
        { id: 'u2', name: 'U2', avatar: '' },
      ],
      typing: [],
    });

    const user2Db = testEnv.authenticatedContext('u2').firestore();
    await assertSucceeds(
      updateDoc(doc(user2Db, 'rooms', 'room-leave'), {
        participants: ['u1'],
        participantProfiles: [{ id: 'u1', name: 'U1', avatar: '' }],
      }),
    );
  });

  it('blocks removing another participant', async () => {
    const adminDb = testEnv.withSecurityRulesDisabled().firestore();
    await setDoc(doc(adminDb, 'rooms', 'room-block-remove'), {
      participants: ['u1', 'u2'],
      participantProfiles: [
        { id: 'u1', name: 'U1', avatar: '' },
        { id: 'u2', name: 'U2', avatar: '' },
      ],
      typing: [],
    });

    const user1Db = testEnv.authenticatedContext('u1').firestore();
    await assertFails(
      updateDoc(doc(user1Db, 'rooms', 'room-block-remove'), {
        participants: ['u1'],
        participantProfiles: [{ id: 'u1', name: 'U1', avatar: '' }],
      }),
    );
  });
});

describeIf('Firestore rules - messages', () => {
  it('allows sender to delete own message', async () => {
    const adminDb = testEnv.withSecurityRulesDisabled().firestore();
    await setDoc(doc(adminDb, 'rooms', 'room-msg'), {
      participants: ['u1'],
      participantProfiles: [{ id: 'u1', name: 'U1', avatar: '' }],
    });
    await setDoc(doc(adminDb, 'rooms', 'room-msg', 'messages', 'm1'), {
      senderId: 'u1',
      text: 'hi',
    });

    const user1Db = testEnv.authenticatedContext('u1').firestore();
    await assertSucceeds(deleteDoc(doc(user1Db, 'rooms', 'room-msg', 'messages', 'm1')));
  });

  it('blocks non-sender from deleting message', async () => {
    const adminDb = testEnv.withSecurityRulesDisabled().firestore();
    await setDoc(doc(adminDb, 'rooms', 'room-msg-2'), {
      participants: ['u1', 'u2'],
      participantProfiles: [
        { id: 'u1', name: 'U1', avatar: '' },
        { id: 'u2', name: 'U2', avatar: '' },
      ],
    });
    await setDoc(doc(adminDb, 'rooms', 'room-msg-2', 'messages', 'm2'), {
      senderId: 'u1',
      text: 'hello',
    });

    const user2Db = testEnv.authenticatedContext('u2').firestore();
    await assertFails(deleteDoc(doc(user2Db, 'rooms', 'room-msg-2', 'messages', 'm2')));
  });
});

describeIf('Firestore rules - rate limits', () => {
  it('allows user to read/write own rate limit', async () => {
    const user1Db = testEnv.authenticatedContext('u1').firestore();
    await assertSucceeds(
      setDoc(doc(user1Db, 'rateLimits', 'u1'), {
        lastMessageTime: Date.now(),
        messageCount: 1,
      }),
    );
    await assertSucceeds(getDoc(doc(user1Db, 'rateLimits', 'u1')));
  });

  it('blocks user from reading another user rate limit', async () => {
    const adminDb = testEnv.withSecurityRulesDisabled().firestore();
    await setDoc(doc(adminDb, 'rateLimits', 'u1'), {
      lastMessageTime: Date.now(),
      messageCount: 5,
    });

    const user2Db = testEnv.authenticatedContext('u2').firestore();
    await assertFails(getDoc(doc(user2Db, 'rateLimits', 'u1')));
  });
});

describeIf('Firestore rules - canvas validation', () => {
  it('allows creating canvas sheet with valid name', async () => {
    const adminDb = testEnv.withSecurityRulesDisabled().firestore();
    await setDoc(doc(adminDb, 'rooms', 'room-canvas'), {
      participants: ['u1'],
      participantProfiles: [{ id: 'u1', name: 'U1', avatar: '' }],
    });

    const user1Db = testEnv.authenticatedContext('u1').firestore();
    await assertSucceeds(
      setDoc(doc(user1Db, 'rooms', 'room-canvas', 'canvasSheets', 's1'), {
        name: 'Sheet 1',
        createdAt: new Date(),
      }),
    );
  });

  it('blocks creating canvas sheet with empty name', async () => {
    const adminDb = testEnv.withSecurityRulesDisabled().firestore();
    await setDoc(doc(adminDb, 'rooms', 'room-canvas-2'), {
      participants: ['u1'],
      participantProfiles: [{ id: 'u1', name: 'U1', avatar: '' }],
    });

    const user1Db = testEnv.authenticatedContext('u1').firestore();
    await assertFails(
      setDoc(doc(user1Db, 'rooms', 'room-canvas-2', 'canvasSheets', 's2'), {
        name: '',
        createdAt: new Date(),
      }),
    );
  });

  it('blocks creating canvas sheet with name > 100 chars', async () => {
    const adminDb = testEnv.withSecurityRulesDisabled().firestore();
    await setDoc(doc(adminDb, 'rooms', 'room-canvas-3'), {
      participants: ['u1'],
      participantProfiles: [{ id: 'u1', name: 'U1', avatar: '' }],
    });

    const user1Db = testEnv.authenticatedContext('u1').firestore();
    await assertFails(
      setDoc(doc(user1Db, 'rooms', 'room-canvas-3', 'canvasSheets', 's3'), {
        name: 'a'.repeat(101),
        createdAt: new Date(),
      }),
    );
  });

  it('allows creating canvas path with valid data', async () => {
    const adminDb = testEnv.withSecurityRulesDisabled().firestore();
    await setDoc(doc(adminDb, 'rooms', 'room-canvas-path'), {
      participants: ['u1'],
      participantProfiles: [{ id: 'u1', name: 'U1', avatar: '' }],
    });

    const user1Db = testEnv.authenticatedContext('u1').firestore();
    await assertSucceeds(
      setDoc(doc(user1Db, 'rooms', 'room-canvas-path', 'canvasPaths', 'p1'), {
        sheetId: 's1',
        user: 'u1',
        points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
        color: '#000000',
      }),
    );
  });

  it('blocks creating canvas path with empty points', async () => {
    const adminDb = testEnv.withSecurityRulesDisabled().firestore();
    await setDoc(doc(adminDb, 'rooms', 'room-canvas-path-2'), {
      participants: ['u1'],
      participantProfiles: [{ id: 'u1', name: 'U1', avatar: '' }],
    });

    const user1Db = testEnv.authenticatedContext('u1').firestore();
    await assertFails(
      setDoc(doc(user1Db, 'rooms', 'room-canvas-path-2', 'canvasPaths', 'p2'), {
        sheetId: 's1',
        user: 'u1',
        points: [],
        color: '#000000',
      }),
    );
  });

  it('blocks creating canvas path with too many points', async () => {
    const adminDb = testEnv.withSecurityRulesDisabled().firestore();
    await setDoc(doc(adminDb, 'rooms', 'room-canvas-path-3'), {
      participants: ['u1'],
      participantProfiles: [{ id: 'u1', name: 'U1', avatar: '' }],
    });

    const user1Db = testEnv.authenticatedContext('u1').firestore();
    const tooManyPoints = Array(10001).fill({ x: 0, y: 0 });
    await assertFails(
      setDoc(doc(user1Db, 'rooms', 'room-canvas-path-3', 'canvasPaths', 'p3'), {
        sheetId: 's1',
        user: 'u1',
        points: tooManyPoints,
        color: '#000000',
      }),
    );
  });
});

describeIf('Firestore rules - games validation', () => {
  it('allows creating game with type and active fields', async () => {
    const adminDb = testEnv.withSecurityRulesDisabled().firestore();
    await setDoc(doc(adminDb, 'rooms', 'room-game'), {
      participants: ['u1'],
      participantProfiles: [{ id: 'u1', name: 'U1', avatar: '' }],
    });

    const user1Db = testEnv.authenticatedContext('u1').firestore();
    await assertSucceeds(
      setDoc(doc(user1Db, 'rooms', 'room-game', 'games', 'g1'), {
        type: 'tictactoe',
        active: true,
      }),
    );
  });

  it('blocks creating game without required fields', async () => {
    const adminDb = testEnv.withSecurityRulesDisabled().firestore();
    await setDoc(doc(adminDb, 'rooms', 'room-game-2'), {
      participants: ['u1'],
      participantProfiles: [{ id: 'u1', name: 'U1', avatar: '' }],
    });

    const user1Db = testEnv.authenticatedContext('u1').firestore();
    await assertFails(
      setDoc(doc(user1Db, 'rooms', 'room-game-2', 'games', 'g2'), {
        type: 'chess',
      }),
    );
  });
});

describeIf('Firestore rules - message reactions validation', () => {
  it('allows updating message with reactions under limit', async () => {
    const adminDb = testEnv.withSecurityRulesDisabled().firestore();
    await setDoc(doc(adminDb, 'rooms', 'room-reactions'), {
      participants: ['u1', 'u2'],
      participantProfiles: [
        { id: 'u1', name: 'U1', avatar: '' },
        { id: 'u2', name: 'U2', avatar: '' },
      ],
    });
    await setDoc(doc(adminDb, 'rooms', 'room-reactions', 'messages', 'm1'), {
      senderId: 'u1',
      text: 'hello',
      reactions: [],
    });

    const user2Db = testEnv.authenticatedContext('u2').firestore();
    const reactions = Array(50).fill({ emoji: '👍', userId: 'u2' });
    await assertSucceeds(
      updateDoc(doc(user2Db, 'rooms', 'room-reactions', 'messages', 'm1'), {
        reactions,
      }),
    );
  });

  it('blocks updating message with reactions over limit', async () => {
    const adminDb = testEnv.withSecurityRulesDisabled().firestore();
    await setDoc(doc(adminDb, 'rooms', 'room-reactions-2'), {
      participants: ['u1', 'u2'],
      participantProfiles: [
        { id: 'u1', name: 'U1', avatar: '' },
        { id: 'u2', name: 'U2', avatar: '' },
      ],
    });
    await setDoc(doc(adminDb, 'rooms', 'room-reactions-2', 'messages', 'm2'), {
      senderId: 'u1',
      text: 'hello',
      reactions: [],
    });

    const user2Db = testEnv.authenticatedContext('u2').firestore();
    const tooManyReactions = Array(51).fill({ emoji: '👍', userId: 'u2' });
    await assertFails(
      updateDoc(doc(user2Db, 'rooms', 'room-reactions-2', 'messages', 'm2'), {
        reactions: tooManyReactions,
      }),
    );
  });
});

describeIf('Smoke e2e: create -> join -> send -> delete own -> leave', () => {
  it('runs happy path with rules', async () => {
    const user1Db = testEnv.authenticatedContext('u1').firestore();
    const user2Db = testEnv.authenticatedContext('u2').firestore();

    await assertSucceeds(
      setDoc(doc(user1Db, 'rooms', 'room-smoke'), {
        participants: ['u1'],
        participantProfiles: [{ id: 'u1', name: 'U1', avatar: '' }],
        typing: [],
      }),
    );

    await assertSucceeds(
      updateDoc(doc(user2Db, 'rooms', 'room-smoke'), {
        participants: ['u1', 'u2'],
        participantProfiles: [
          { id: 'u1', name: 'U1', avatar: '' },
          { id: 'u2', name: 'U2', avatar: '' },
        ],
      }),
    );

    await assertSucceeds(
      setDoc(doc(user2Db, 'rooms', 'room-smoke', 'messages', 'm1'), {
        senderId: 'u2',
        text: 'hello from u2',
      }),
    );

    // Non-sender delete must fail
    await assertFails(deleteDoc(doc(user1Db, 'rooms', 'room-smoke', 'messages', 'm1')));

    // Sender delete must succeed
    await assertSucceeds(deleteDoc(doc(user2Db, 'rooms', 'room-smoke', 'messages', 'm1')));

    // Leave room by removing only self
    await assertSucceeds(
      updateDoc(doc(user2Db, 'rooms', 'room-smoke'), {
        participants: ['u1'],
        participantProfiles: [{ id: 'u1', name: 'U1', avatar: '' }],
      }),
    );

    const adminDb = testEnv.withSecurityRulesDisabled().firestore();
    const roomSnap = await getDoc(doc(adminDb, 'rooms', 'room-smoke'));
    expect(roomSnap.data()?.participants).toEqual(['u1']);
  });
});
