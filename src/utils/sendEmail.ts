import nodemailer from "nodemailer";
import { SendMailClient } from "zeptomail";

const url: any = "https://api.zeptomail.in/v1.1/email";
const token: any = "Zoho-enczapikey PHtE6r0IEbjo2jQro0cHsfOwRZKkPIl89O00LQFDs48RCfcKSk0G+Nl9k2C2qkouUvlGR6SYnN9pubua4rmALD3pZz4fXmqyqK3sx/VYSPOZsbq6x00bs1oTckzYV4/petVs0STevNncNA==";

const client = new SendMailClient({ url, token });

// //###############Zepto Email#####################

// export async function sendEmail({
//   to,
//   subject,
//   html
// }: {
//   to: string;
//   subject: string;
//   html: string;
// }) {
//   try {
//     const response = await client.sendMail({
//       from: {
//         address: "noreply@pharmatoindia.com",
//         name: "Pharmato"
//       },
//       to: [
//         {
//           email_address: {
//             address: to,
//             name: "Pharmato"
//           }
//         }
//       ],
//       subject,
//       htmlbody: html
//     });

//     console.log("✅ Email sent successfully:", response);

//     return {
//       success: true,
//       message: "Email sent successfully",
//       data: response
//     };

//   } catch (error: any) {

//     console.error(
//       "❌ Email Send Error:",
//       JSON.stringify(error.message || error, null, 2)
//     );

//     return {
//       success: false,
//       message: "Failed to send email",
//       error: JSON.stringify(error.message || error, null, 2)
//     };

//   }
// }

//####################Brevo Email#####################
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

    // let transporter = nodemailer.createTransport({
    //   host: 'smtp-relay.brevo.com',
    //   port: 587,
    //   auth: {
    //     user: 'a40dfd001@smtp-brevo.com',
    //     pass: 'YkyFGfKXJ3mq9p2R'
    //   }
    // });

    // // Send email with the Excel attachment
    // const transporter = nodemailer.createTransport({
    //   host: 'mail.smtp2go.com',
    //   port: 2525,
    //   auth: {
    //     user: 'sunil.patidar+2@technotoil.com',
    //     pass: 'tJ2juQjWYyOPbUpM'
    //   }
    // });

    // Send email with the Excel attachment
    const transporter = nodemailer.createTransport({
      host: 'mail.smtp2go.com',
      port: 2525,
      auth: {
        user: 'mayank.pawar+55@technotoil.com',
        pass: 'e1nAdYQNgg3wQ9O7'
      }
    });

    let mailOptions = {
      // from: 'sunil.patidar+5@technotoil.com',
      from: 'mayank.pawar+55@technotoil.com',
      to: `${to}`,
      subject: subject,
      text: 'Hello world?',
      html: html
    };

    let response = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', response);
  } catch (error) {
    console.error('Error sending email:', error);
  }

}
