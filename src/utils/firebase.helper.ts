
import admin from 'firebase-admin';
import * as dotenv from 'dotenv';
dotenv.config();

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  : null;

function initFirebase() {
  if (!admin.apps.length) {
    if (serviceAccount && typeof serviceAccount === 'object' && serviceAccount.project_id) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as any),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
    } else {
      console.warn('Firebase service account not configured - skipping initialization');
    }
  }
}

export async function sendPushNotification({
  token,
  title,
  body,
}: {
  token: string;
  title: string;
  body: string;
}) {
  initFirebase();

  const message = {
    notification: { title, body },
    token,
  };

  console.log('Notification payload', message);

  if (!admin.apps.length) {
    console.warn('Firebase not initialized; skipping sendPushNotification');
    return;
  }

  try {
    await admin.messaging().send(message);
    console.log('Notification sent successfully');
  } catch (error) {
    console.log('error', error);
  }

}

export async function sendPushNotificationWithData({
  token,
  title,
  body,
  data
}: {
  token: string;
  title: string;
  body: string;
  data: Record<string, any>;
}) {

  initFirebase();

  const message = {
    notification: { title, body },
    token,
    data,
  };

  console.log('Notification payload', message);

  if (!admin.apps.length) {
    console.warn('Firebase not initialized; skipping sendPushNotificationWithData');
    return;
  }

  try {
    await admin.messaging().send(message);
    console.log('Notification sent successfully');
  } catch (error) {
    console.log('error', error);
  }

}

export function getDb() {
  initFirebase();
  if (!admin.apps.length) throw new Error('Firebase not configured');
  return admin.database();
}

export { initFirebase };