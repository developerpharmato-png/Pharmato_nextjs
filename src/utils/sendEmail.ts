import nodemailer from 'nodemailer';

export async function sendEmail({ to, subject, html }: {
    to: string;
    subject: string;
    html: string;
}) {
    // console.log("zzzz");
    
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
        port: 587,
        auth: {
            user: process.env.SMTP_USER || '9d968a001@smtp-brevo.com',
            pass: process.env.SMTP_PASS || 'bCvZcqWrGhxLDwAM',
        },
        tls: {
            rejectUnauthorized: false // Allow self-signed certificates (development only)
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
        return { success: true, info };
    } catch (error) {
        console.error('Email send error:', error);
        return { success: false, message: error?.message || String(error) };
    }
}
