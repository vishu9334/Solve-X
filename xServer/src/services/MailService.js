import nodemailer from "nodemailer";
import { registerOtpTemplate } from "../helpers/templates/registerOtpTemplate.js";
import { logger } from "../utils/logger.js";
import config from "../configs/config.js";

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.APP_EMAIL,
        pass: config.APP_PASSWORD,
      },
    });
  }

  async sendOtpEmail(email, otp) {
    try {
      const mailOptions = {
        from: config.APP_EMAIL || '"Solve-X" <noreply@solve-x.com>',
        to: email,
        subject: "Your Registration OTP - Solve-X",
        html: registerOtpTemplate(otp),
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`OTP Email sent to ${email}: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send OTP Email to ${email}: ${error.message}`);
      throw error;
    }
  }
}

export default new MailService();
