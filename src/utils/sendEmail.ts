import nodemailer from 'nodemailer';

export async function sendEmail({ to, subject, html }: {
    to: string;
    subject: string;
    html: string;
}) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
        port: 587,
        auth: {
            user: process.env.SMTP_USER || '9d968a001@smtp-brevo.com',
            pass: process.env.SMTP_PASS || 'bCvZcqWrGhxLDwAM',
        }
    });

    const mailOptions = {
        from: process.env.SMTP_FROM || 'developer.pharmato@gmail.com',
        to,
        subject,
        html
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Email send error:', error);
        throw error;
    }
}
