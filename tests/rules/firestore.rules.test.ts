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

const projectId = 'chatforus-test';
let testEnv: RulesTestEnvironment;

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

describe('Firestore rules - participants', () => {
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

describe('Firestore rules - messages', () => {
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

describe('Smoke e2e: create -> join -> send -> delete own -> leave', () => {
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

