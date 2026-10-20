import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure environment variables are loaded with fallback resolution
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const port = Number(process.env.SMTP_PORT) || 465;
const secure = port === 465;

export const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: port,
  secure: secure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Sends an email via configured Nodemailer SMTP transporter.
 *
 * @param {Object} options - Email options (to, subject, text, html, from)
 * @returns {Promise<Object>} info - Nodemailer dispatch result
 */
export const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: options.from || process.env.SMTP_FROM || `"ControlHub Safety Engine" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ SMTP Dispatch Success:', info.messageId, info.response);
    return info;
  } catch (error) {
    console.error('❌ SMTP Dispatch Error:', error);
    throw error;
  }
};

export default sendEmail;
