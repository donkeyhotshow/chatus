import { initializeApp } from 'firebase/app';
import { getDatabase, connectDatabaseEmulator, ref, get, set } from 'firebase/database';
import { PresenceManager } from '../src/lib/realtime';

// --- Firebase Emulator Setup ---
const config = {
  projectId: "demo-test-project",
};
const app = initializeApp(config);
const rtdb = getDatabase(app);
connectDatabaseEmulator(rtdb, "localhost", 9000);

// --- Utility to clear RTDB for tests ---
async function clearDatabase() {
  await set(ref(rtdb, ''), null);
}

// --- Tests for PresenceManager ---
describe('PresenceManager (per-connection)', () => {
  const userId = 'testUser123';
  let presenceManager: PresenceManager;

  beforeEach(async () => {
    await clearDatabase(); // Clear DB before each test
    presenceManager = new PresenceManager(userId);
  });

  afterEach(async () => {
    await presenceManager.goOffline(); // Ensure offline state is cleaned
    await clearDatabase();
  });

  test('should set user online with a unique connection ID', async () => {
    await presenceManager.goOnline(userId);

    const connectionsSnapshot = await get(ref(rtdb, `connections/${userId}`));
    expect(connectionsSnapshot.exists()).toBe(true);
    const connections = connectionsSnapshot.val();
    expect(Object.keys(connections).length).toBe(1);

    const statusSnapshot = await get(ref(rtdb, `status/${userId}`));
    expect(statusSnapshot.exists()).toBe(true);
    expect(statusSnapshot.val().state).toBe('online');
    expect(statusSnapshot.val().activeConnections).toBe(1);
  });

  test('should maintain online status with multiple connections', async () => {
    const presenceManager2 = new PresenceManager(userId);

    await presenceManager.goOnline(userId);
    await presenceManager2.goOnline(userId);

    const connectionsSnapshot = await get(ref(rtdb, `connections/${userId}`));
    expect(connectionsSnapshot.exists()).toBe(true);
    expect(Object.keys(connectionsSnapshot.val()).length).toBe(2);

    const statusSnapshot = await get(ref(rtdb, `status/${userId}`));
    expect(statusSnapshot.exists()).toBe(true);
    expect(statusSnapshot.val().state).toBe('online');
    expect(statusSnapshot.val().activeConnections).toBe(2);

    await presenceManager2.goOffline(); // Disconnect one

    const connectionsSnapshotAfterDisconnect = await get(ref(rtdb, `connections/${userId}`));
    expect(Object.keys(connectionsSnapshotAfterDisconnect.val()).length).toBe(1);

    const statusSnapshotAfterDisconnect = await get(ref(rtdb, `status/${userId}`));
    expect(statusSnapshotAfterDisconnect.exists()).toBe(true);
    expect(statusSnapshotAfterDisconnect.val().state).toBe('online'); // Still online!
    expect(statusSnapshotAfterDisconnect.val().activeConnections).toBe(1);

    await presenceManager.goOffline(); // Disconnect the last one

    const connectionsSnapshotFinal = await get(ref(rtdb, `connections/${userId}`));
    expect(connectionsSnapshotFinal.exists()).toBe(false);

    const statusSnapshotFinal = await get(ref(rtdb, `status/${userId}`));
    expect(statusSnapshotFinal.exists()).toBe(true);
    expect(statusSnapshotFinal.val().state).toBe('offline');
    expect(statusSnapshotFinal.val().activeConnections).toBe(0);
  });

  test('should go offline when the last connection is removed', async () => {
    await presenceManager.goOnline(userId);
    await presenceManager.goOffline();

    const connectionsSnapshot = await get(ref(rtdb, `connections/${userId}`));
    expect(connectionsSnapshot.exists()).toBe(false);

    const statusSnapshot = await get(ref(rtdb, `status/${userId}`));
    expect(statusSnapshot.exists()).toBe(true);
    expect(statusSnapshot.val().state).toBe('offline');
    expect(statusSnapshot.val().activeConnections).toBe(0);
  });

  test('onDisconnect should remove connection and update status', async () => {
    // Simulate a client going online
    await presenceManager.goOnline(userId);
    
    // Verify initial state
    let statusSnapshot = await get(ref(rtdb, `status/${userId}`));
    expect(statusSnapshot.val().state).toBe('online');
    expect(statusSnapshot.val().activeConnections).toBe(1);

    // Simulate disconnection by setting the connection ref to null directly in RTDB
    // This mimics onDisconnect behavior without actual client disconnect
    const connectionsRef = ref(rtdb, `connections/${userId}`);
    const connections = (await get(connectionsRef)).val();
    const connId = Object.keys(connections)[0];
    await set(ref(rtdb, `connections/${userId}/${connId}`), null);

    // Wait for the aggregated status to update (might need a small delay for RTDB listener)
    await new Promise(resolve => setTimeout(resolve, 100)); 

    statusSnapshot = await get(ref(rtdb, `status/${userId}`));
    expect(statusSnapshot.val().state).toBe('offline');
    expect(statusSnapshot.val().activeConnections).toBe(0);
  });
});
