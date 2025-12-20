
import admin from 'firebase-admin';
import * as dotenv from 'dotenv';
dotenv.config();

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

export async function sendPushNotification({
  token,
  title,
  body,
}: {
  token: string;
  title: string;
  body: string;
}) {

  const message = {
    notification: {
      "title": title,
      "body": body
    },
    token: token,
  };

  console.log('Notification sent successfully', message);


  try {
    await admin.messaging().send(message)
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

  const message = {
    notification: {
      "title": title,
      "body": body
    },
    token: token,
    data: data
  };

  console.log('Notification sent successfully', message);


  try {
    await admin.messaging().send(message)
    console.log('Notification sent successfully');
  } catch (error) {
    console.log('error', error);

  }

}

const db = admin.database();

export { db };