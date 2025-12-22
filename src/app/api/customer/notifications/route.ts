import { sendPushNotification } from '@/utils/firebase.helper';
import { NextResponse } from 'next/server';

// Dummy API to send notification to customer (no body required)
export async function POST() {
    // Simulate sending notification (add your code here)

    const deviceToken = "cPooy-T41SejN9n8ltFeAF:APA91bE2XLqvjjxuHLf61p1OWc90U6r9WT0H6qjdADoYJ-mpoKb2UjTVUWEeO8oDF0hI71aKXkWYVl6SMiQnoJ-xJGAOfclu9E-jjQk0kwwAFB53pldwrhg";
    const title = "Pharmato";
    const body = `This is a dummy notification to customer.`;

    await sendPushNotification({
        token: deviceToken,
        title,
        body,
    });

    // Return a dummy success response
    return NextResponse.json({
        success: true,
        message: 'Notification sent to customer (dummy)',
    });
}
