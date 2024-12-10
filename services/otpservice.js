const nodemailer = require("nodemailer");

const generateOTP = () => Math.floor(10000 + Math.random() * 90000).toString();

const sendOTP = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your One-Time Password (OTP)",
      html: `
       <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 500px; margin: auto; text-align: center;">
  <p>Your one-time OTP is:</p>
  <div style="margin: 20px 0;">
    <code style="font-size: 24px; font-weight: bold; color: #4CAF50; padding: 10px; background: #f9f9f9; border-radius: 5px; display: inline-block;">${otp}</code>
  </div>
  <p>Please use this OTP within <strong>5 minutes</strong>. Do not share this with anyone.</p>
</div>

      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}: ${info.response}`);
    return true;
  } catch (error) {
    console.error(`Failed to send OTP email to ${email}:`, error.message);
    return false;
  }
};

module.exports = { generateOTP, sendOTP };
