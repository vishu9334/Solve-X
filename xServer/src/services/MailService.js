import { BrevoClient } from "@getbrevo/brevo";
import config from "../configs/config.js";

class MailService {
  constructor() {
    this.brevo = new BrevoClient({
      apiKey: config.BREVO_API_KEY || config.SMTP_KEY,
    });
  }

  async sendOtpEmail(toEmail, otp) {
    try {
      console.log("Sending OTP email to:", toEmail);

      const response =
        await this.brevo.transactionalEmails.sendTransacEmail({
          sender: {
            name: "MentorApp",
            email: config.BREVO_FROM_EMAIL,
          },

          to: [
            {
              email: toEmail,
            },
          ],

          subject: "Your OTP Code",

          htmlContent: `
            <h2>Email Verification</h2>
            <p>Your OTP is: <strong>${otp}</strong></p>
            <p>Valid for 10 minutes. Do not share this with anyone.</p>
          `,
        });

      console.log("OTP email sent successfully to:", toEmail);

      return response;
    } catch (error) {
      console.log("Brevo email sending failed:");
      console.log(error?.body || error?.response?.body || error?.message || error);

      throw error;
    }
  }

  async sendResultEmail(toEmail, subject, htmlContent) {
    try {
      console.log("Sending result email to:", toEmail, "Subject:", subject);

      const response = await this.brevo.transactionalEmails.sendTransacEmail({
        sender: {
          name: "Solve-X Team",
          email: config.BREVO_FROM_EMAIL,
        },
        to: [
          {
            email: toEmail,
          },
        ],
        subject: subject,
        htmlContent: htmlContent,
      });

      console.log("Result email sent successfully to:", toEmail);
      return response;
    } catch (error) {
      console.log("Brevo result email sending failed:");
      console.log(error?.body || error?.response?.body || error?.message || error);
      throw error;
    }
  }
}

export default new MailService();