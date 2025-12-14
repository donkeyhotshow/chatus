import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const sendPushOnMessage = functions.firestore
  .document('messages/{messageId}')
  .onCreate(async (snap) => {
    const data = snap.data();

    const tokensSnap = await admin.firestore()
      .collection('fcmTokens')
      .where('userId', '==', data.toUserId)
      .get();

    const tokens = tokensSnap.docs.map(d => d.data().token);

    if (!tokens.length) return;

    const payload = {
      notification: {
        title: data.senderName,
        body: data.text,
      },
      data: {
        roomId: data.roomId,
      },
    };

    await admin.messaging().sendEachForMulticast({
      tokens,
      ...payload,
    });
  });
