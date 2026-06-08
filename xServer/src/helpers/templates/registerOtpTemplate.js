export const registerOtpTemplate = (otp) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
      <h2 style="color: #111827;">Welcome to Solve-X</h2>
      <p style="color: #4b5563; line-height: 1.5;">Your one-time password (OTP) for registration is:</p>
      <div style="background-color: #f3f4f6; border-radius: 6px; padding: 16px; text-align: center; margin: 24px 0;">
        <h1 style="font-size: 36px; letter-spacing: 8px; color: #4f46e5; margin: 0;">${otp}</h1>
      </div>
      <p style="color: #4b5563; line-height: 1.5;">This OTP is valid for <strong>3 minutes</strong>. Please do not share this code with anyone.</p>
      <p style="color: #9ca3af; font-size: 14px; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px;">If you did not request this OTP, please safely ignore this email.</p>
    </div>
  `;
};
