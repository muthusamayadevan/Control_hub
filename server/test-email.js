import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// Explicit absolute path env loading with fallback resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const smtpUser = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : '';
const smtpPass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '';
const recipient = (process.env.ALERT_RECIPIENT_EMAIL?.trim()) || smtpUser;

console.log('=============================================');
console.log('   ControlHub Gmail SMTP Diagnostic Engine   ');
console.log('=============================================');
console.log(`SMTP_USER:             ${smtpUser || '<NOT SET>'}`);
console.log(`SMTP_PASS:             ${smtpPass ? `[Set - ${smtpPass.length} chars]` : '<NOT SET>'}`);
console.log(`Target Recipient:      ${recipient || '<NOT SET>'}`);
console.log('---------------------------------------------');

if (!smtpUser || !smtpPass) {
  console.error('\n❌ ERROR: Missing SMTP credentials.');
  console.error('Please configure SMTP_USER and SMTP_PASS in server/.env.');
  console.error('Example:');
  console.error('  SMTP_USER=your-email@gmail.com');
  console.error('  SMTP_PASS=your-16-char-app-password\n');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

async function runDiagnostic() {
  try {
    console.log('\n[Step 1/2] Verifying SMTP connection and credentials...');
    await transporter.verify();
    console.log('✅ Connection verified: Gmail credentials and App Password are valid.');

    console.log(`\n[Step 2/2] Dispatching diagnostic test email to: ${recipient}...`);
    const info = await transporter.sendMail({
      from: `"ControlHub Diagnostic Engine" <${smtpUser}>`,
      to: recipient,
      subject: '🚨 ControlHub Diagnostic: Gmail SMTP Engine Verified',
      text: 'Congratulations! Your ControlHub Gmail SMTP automated dispatch engine is successfully verified and fully operational.\n\n' +
            `Dispatched at: ${new Date().toISOString()}\n` +
            `Authenticated as: ${smtpUser}\n`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0F172A; padding: 32px; color: #F8FAFC; border-radius: 12px; max-width: 500px;">
          <h2 style="color: #38BDF8; margin-top: 0;">ControlHub Telemetry & Alerting</h2>
          <div style="background-color: #1E293B; border-left: 4px solid #10B981; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
            <strong style="color: #10B981;">✅ SMTP Engine Operational</strong>
            <p style="margin: 8px 0 0 0; color: #CBD5E1; font-size: 14px;">Your Gmail App Password has been successfully verified, and end-to-end email delivery is confirmed.</p>
          </div>
          <table style="width: 100%; font-size: 13px; color: #94A3B8;">
            <tr>
              <td style="padding: 4px 0;"><strong>Sender:</strong></td>
              <td style="color: #F8FAFC;">${smtpUser}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;"><strong>Recipient:</strong></td>
              <td style="color: #F8FAFC;">${recipient}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;"><strong>Timestamp:</strong></td>
              <td style="color: #F8FAFC;">${new Date().toISOString()}</td>
            </tr>
          </table>
          <hr style="border: 0; border-top: 1px solid #334155; margin: 24px 0 16px 0;" />
          <p style="font-size: 12px; color: #64748B; margin: 0;">ControlHub Smart Home Automation &copy; ${new Date().getFullYear()}</p>
        </div>
      `,
    });

    console.log('✅ Test email successfully dispatched!');
    console.log(`Message ID: ${info.messageId}`);
    if (info.response) {
      console.log(`Server Response: ${info.response}`);
    }
    console.log('\n=============================================');
    console.log('   🎉 ALL SMTP DIAGNOSTIC CHECKS PASSED      ');
    console.log('=============================================');
  } catch (error) {
    console.error('\n❌ SMTP DIAGNOSTIC FAILED');
    console.error(`Error Code: ${error.code || 'UNKNOWN'}`);
    console.error(`Error Message: ${error.message}`);
    if (error.response) {
      console.error(`SMTP Response: ${error.response}`);
    }
    if (error.code === 'EAUTH') {
      console.error('\n💡 Authentication Failed (EAUTH):');
      console.error('- Ensure 2-Step Verification is enabled on your Google Account.');
      console.error('- Use a dedicated 16-character App Password (not your account login password).');
      console.error('- Verify that SMTP_USER matches your Gmail address exactly.');
    }
    process.exit(1);
  }
}

runDiagnostic();
