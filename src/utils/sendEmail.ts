import nodemailer from "nodemailer";
import { SendMailClient } from "zeptomail";

const url: any = "https://api.zeptomail.in/v1.1/email";
const token: any = "Zoho-enczapikey PHtE6r0IEbjo2jQro0cHsfOwRZKkPIl89O00LQFDs48RCfcKSk0G+Nl9k2C2qkouUvlGR6SYnN9pubua4rmALD3pZz4fXmqyqK3sx/VYSPOZsbq6x00bs1oTckzYV4/petVs0STevNncNA==";

const client = new SendMailClient({ url, token });

// export async function sendEmail({
//   to,
//   subject,
//   html,
// }: {
//   to: string;
//   subject: string;
//   html: string;
// }) {

//   // // ## SMTP configuration for sending emails (using Bravo SMTP server)
//   // // const transporter = nodemailer.createTransport({
//   // //   host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
//   // //   port: 587,
//   // //   auth: {
//   // //     user: process.env.SMTP_USER || "9d968a001@smtp-brevo.com",
//   // //     pass: process.env.SMTP_PASS || "bCvZcqWrGhxLDwAM",
//   // //   },
//   // //   tls: {
//   // //     rejectUnauthorized: false, // Allow self-signed certificates (development only)
//   // //   },
//   // // });


//   // const transporter = nodemailer.createTransport({
//   //   host: "smtp.zeptomail.in",
//   //   port: 587,
//   //   auth: {
//   //     user: "emailapikey",
//   //     pass: "PHtE6r0IEbjo2jQro0cHsfOwRZKkPIl89O00LQFDs48RCfcKSk0G+Nl9k2C2qkouUvlGR6SYnN9pubua4rmALD3pZz4fXmqyqK3sx/VYSPOZsbq6x00bs1oTckzYV4/petVs0STevNncNA==",
//   //   }
//   // });

//   // const mailOptions = {
//   //   from: "noreply@pharmatoindia.com", // ✅ must be verified
//   //   to,
//   //   subject,
//   //   html,
//   // };

//   // console.log("📧 Sending email to:", mailOptions);

//   // try {
//   //   const info = await transporter.sendMail(mailOptions);
//   //   console.log("Message sent: %s", info.messageId);
//   //   return { success: true, info };
//   // } catch (error: any) {
//   //   console.error("Email send error:", error);
//   //   return { success: false, message: error?.message || String(error) };
//   // }


// let client = new SendMailClient({url, token});

// client.sendMail({
//     "from": 
//     {
//         "address": "noreply@pharmatoindia.com",
//         "name": "noreply"
//     },
//     "to": 
//     [
//         {
//         "email_address": 
//             {
//                 "address": to,
//                 "name": "Pharmato"
//             }
//         }
//     ],
//     "subject": subject,
//     "htmlbody": html,
// })

// }

export async function sendEmail({
  to,
  subject,
  html
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const response = await client.sendMail({
      from: {
        address: "noreply@pharmatoindia.com",
        name: "Pharmato"
      },
      to: [
        {
          email_address: {
            address: to,
            name: "Pharmato"
          }
        }
      ],
      subject,
      htmlbody: html
    });

    console.log("✅ Email sent successfully:", response);

    return {
      success: true,
      message: "Email sent successfully",
      data: response
    };

  } catch (error: any) {

    console.error(
      "❌ Email Send Error:",
      JSON.stringify(error.message || error, null, 2)
    );

    return {
      success: false,
      message: "Failed to send email",
      error: JSON.stringify(error.message || error, null, 2)
    };

  }
}
