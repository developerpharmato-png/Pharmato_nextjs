import nodemailer from "nodemailer";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {

  // ## SMTP configuration for sending emails (using Bravo SMTP server)
  // const transporter = nodemailer.createTransport({
  //   host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  //   port: 587,
  //   auth: {
  //     user: process.env.SMTP_USER || "9d968a001@smtp-brevo.com",
  //     pass: process.env.SMTP_PASS || "bCvZcqWrGhxLDwAM",
  //   },
  //   tls: {
  //     rejectUnauthorized: false, // Allow self-signed certificates (development only)
  //   },
  // });


  //  SMTP configuration for sending emails (using Zoho SMTP server)
  const transporter = nodemailer.createTransport({
    host: "smtp.zoho.in",
    port: 465,
    secure: true,
    auth: {
      user: "developer@pharmatoindia.com",
      pass: "6jYBwhqZM2j1",
    },
  });

  const mailOptions = {
    from: '"Pharmato" <developer@pharmatoindia.com>',
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    return { success: true, info };
  } catch (error: any) {
    console.error("Email send error:", error);
    return { success: false, message: error?.message || String(error) };
  }
}
