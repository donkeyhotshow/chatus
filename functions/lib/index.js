"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onMessageCreate = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();
/**
 * On message create:
 * - update rateLimits/{senderId}.lastMessage = serverTimestamp()
 * - send FCM push to other participants (if tokens exist)
 */
exports.onMessageCreate = (0, firestore_1.onDocumentCreated)('rooms/{roomId}/messages/{messageId}', async (event) => {
    var _a;
    const snapshot = event.data;
    if (!snapshot)
        return;
    const context = event.params;
    const message = snapshot.data();
    if (!message)
        return;
    const roomId = context.roomId;
    const senderId = message.senderId;
    try {
        // Update rate limit doc
        if (senderId) {
            await db.doc(`rateLimits/${senderId}`).set({
                lastMessage: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }
        // Fetch room participants
        const roomSnap = await db.doc(`rooms/${roomId}`).get();
        if (!roomSnap.exists)
            return;
        const roomData = roomSnap.data();
        const participants = roomData.participants || [];
        // For each participant except sender, collect tokens from fcmTokens collection
        const targetUids = participants.filter(uid => uid !== senderId);
        if (targetUids.length === 0)
            return;
        // Firestore 'in' queries support up to 10 items; chunk if needed
        const chunkSize = 10;
        const allTokens = [];
        for (let i = 0; i < targetUids.length; i += chunkSize) {
            const chunk = targetUids.slice(i, i + chunkSize);
            const tokensSnap = await db.collection('fcmTokens').where('userId', 'in', chunk).get();
            tokensSnap.docs.forEach(d => {
                const data = d.data();
                if (data === null || data === void 0 ? void 0 : data.token)
                    allTokens.push(data.token);
            });
        }
        if (allTokens.length === 0)
            return;
        const notification = {
            notification: {
                title: ((_a = message.user) === null || _a === void 0 ? void 0 : _a.name) || 'New message',
                body: (message.text && message.text.substring(0, 200)) || '',
            },
            data: {
                roomId,
                messageId: snapshot.id,
                senderId: senderId
            }
        };
        // Send multicast (split into batches of 500)
        const BATCH_SIZE = 500;
        for (let i = 0; i < allTokens.length; i += BATCH_SIZE) {
            const batch = allTokens.slice(i, i + BATCH_SIZE);
            const response = await messaging.sendEachForMulticast(Object.assign({ tokens: batch }, notification));
            // Cleanup invalid tokens
            response.responses.forEach((res, idx) => {
                if (!res.success) {
                    const error = res.error;
                    const badToken = batch[idx];
                    const code = error && error.code;
                    if (code === 'messaging/invalid-registration-token' || code === 'messaging/registration-token-not-registered') {
                        // Remove fcmTokens/{token} doc (we store token as doc id)
                        db.collection('fcmTokens').doc(badToken).delete().catch(() => { });
                    }
                }
            });
        }
    }
    catch (err) {
        console.error('onMessageCreate error', err);
    }
});
//# sourceMappingURL=index.js.map