import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicit absolute path env loading with fallback resolution
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

let transporterInstance = null;

/**
 * Initializes and returns the Nodemailer SMTP transporter.
 * Uses custom SMTP credentials if present in environment variables,
 * otherwise falls back to a test account via Ethereal or JSON transport.
 */
export async function getTransporter() {
  if (transporterInstance) {
    return transporterInstance;
  }

  const host = process.env.SMTP_HOST?.trim();
  const port = process.env.SMTP_PORT?.trim() ? Number(process.env.SMTP_PORT.trim()) : 587;
  const secure = process.env.SMTP_SECURE?.trim() === 'true';
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, '');

  // 1. Real SMTP configuration if SMTP_USER and SMTP_PASS are provided in .env
  if (user && pass) {
    const isGmail = user.includes('@gmail.com');
    const transportConfig = isGmail
      ? {
          service: 'gmail',
          auth: {
            user: user,
            pass: pass,
          },
        }
      : {
          host: host || 'smtp.gmail.com',
          port: port || 587,
          secure: secure,
          auth: {
            user: user,
            pass: pass,
          },
        };
    transporterInstance = nodemailer.createTransport(transportConfig);
    console.log(`[AlertService] Configured real SMTP transport (${isGmail ? 'Gmail' : host || 'smtp.gmail.com'}) for ${user}`);
    return transporterInstance;
  }

  // 2. Automated Ethereal test account fallback for local execution
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporterInstance = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`[AlertService] Ethereal SMTP test account initialized: ${testAccount.user}`);
    return transporterInstance;
  } catch (err) {
    console.warn('[AlertService] Could not initialize Ethereal, falling back to JSON mock transport:', err.message);
    transporterInstance = nodemailer.createTransport({
      jsonTransport: true,
    });
    return transporterInstance;
  }
}

/**
 * Evaluates whether an appliance activation violates safety or energy thresholds
 * and dispatches an automated email alert if criteria are met.
 *
 * Criteria:
 * - Appliance is turned ON (status === true) AND
 *   (ratedPower >= 1000W OR totalLoad >= 3.0 kW)
 *
 * @param {Object} appliance - The appliance object being toggled
 * @param {number} totalLoad - Total aggregate power load (in Watts or kW)
 * @param {string} [userEmail] - Optional email of the currently logged-in user
 * @returns {Promise<Object>} Result object indicating dispatch status
 */
export async function checkAndSendAlert(appliance, totalLoad = 0, userEmail = null) {
  try {
    if (!appliance) {
      return { triggered: false, reason: 'No appliance provided' };
    }

    const ratedPower = Number(appliance.powerUsage || appliance.ratedPower || 0);
    const isHighDraw = ratedPower >= 1000;

    // Normalize totalLoad: if greater than 100, assume Watts; otherwise assume kW
    const totalLoadWatts = Number(totalLoad) > 100 ? Number(totalLoad) : Number(totalLoad) * 1000;
    const totalLoadKw = (totalLoadWatts / 1000).toFixed(2);
    const isOverload = totalLoadWatts >= 3000;

    const isStatusOn = appliance.status === true || appliance.status === 'true';

    // Must be ON and either high-draw (>= 1000W) or total load exceeding 3.0 kW
    if (!isStatusOn || (!isHighDraw && !isOverload)) {
      return {
        triggered: false,
        reason: 'Thresholds not reached',
        isHighDraw,
        isOverload,
        ratedPower,
        totalLoadKw,
      };
    }

    // Strictly require authenticated userEmail for dispatch
    const isValidEmail = (email) => {
      if (!email || typeof email !== 'string') return false;
      const trimmed = email.trim();
      return (
        trimmed.length > 0 &&
        trimmed !== 'undefined' &&
        trimmed !== 'null' &&
        trimmed !== 'unauthenticated' &&
        trimmed.includes('@')
      );
    };

    if (!isValidEmail(userEmail)) {
      console.log('[AlertEngine] No authenticated user email found. Dispatch skipped.');
      return {
        triggered: false,
        reason: 'No authenticated user email found. Dispatch skipped.',
      };
    }

    const recipientToUse = userEmail.trim();
    console.log('[AlertEngine] Authenticated user email verified for alert dispatch:', recipientToUse);

    const transporter = await getTransporter();
    const senderEmail = process.env.SMTP_FROM?.trim() || `"ControlHub Safety Engine" <${process.env.SMTP_USER?.trim() || 'alerts@controlhub.io'}>`;

    const reasons = [];
    if (isHighDraw) reasons.push(`High-draw appliance activated (≥ 1000 W)`);
    if (isOverload) reasons.push(`Aggregate facility load exceeds safe 3.0 kW threshold (${totalLoadKw} kW)`);

    const mailOptions = {
      from: senderEmail,
      to: recipientToUse,
      subject: `🚨 ControlHub Safety Alert: ${isHighDraw ? 'High-Power Appliance' : 'Capacity Threshold'} Active (${appliance.name})`,
      text: `ControlHub Proactive Safety Alert\n\n` +
        `Appliance: ${appliance.name}\n` +
        `Room: ${appliance.room || 'General'}\n` +
        `Power Draw: ${ratedPower} W (${(ratedPower / 1000).toFixed(2)} kW)\n` +
        `Current Total Load: ${totalLoadKw} kW\n` +
        `Reason: ${reasons.join(' & ')}\n` +
        `Timestamp: ${new Date().toISOString()}\n\n` +
        `Please verify facility telemetry and circuit breaker load limits.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0F172A; margin: 0; padding: 24px; color: #F8FAFC; }
            .container { max-width: 560px; margin: 0 auto; background: #1E293B; border-radius: 12px; border: 1px solid #334155; overflow: hidden; }
            .header { background: linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%); padding: 24px; border-bottom: 1px solid #334155; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; background: #EF4444; color: #FFFFFF; text-transform: uppercase; letter-spacing: 0.05em; }
            .title { font-size: 20px; font-weight: 800; color: #FFFFFF; margin: 12px 0 4px; }
            .subtitle { font-size: 13px; color: #94A3B8; margin: 0; }
            .content { padding: 24px; }
            .metric-card { background: #0F172A; border-radius: 8px; border: 1px solid #334155; padding: 16px; margin-bottom: 16px; }
            .metric-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #1E293B; font-size: 13px; }
            .metric-row:last-child { border-bottom: none; }
            .metric-label { color: #94A3B8; }
            .metric-value { color: #F8FAFC; font-weight: 600; }
            .highlight-red { color: #F87171; font-weight: 700; }
            .highlight-amber { color: #FBBF24; font-weight: 700; }
            .footer { padding: 16px 24px; background: #0F172A; border-top: 1px solid #334155; font-size: 12px; color: #64748B; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <span class="badge">Safety Telemetry</span>
              <div class="title">Proactive High-Load Alert</div>
              <p class="subtitle">An appliance exceeding threshold limits has been switched ON.</p>
            </div>
            <div class="content">
              <div class="metric-card">
                <div class="metric-row">
                  <span class="metric-label">Appliance</span>
                  <span class="metric-value">${appliance.name}</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">Zone / Room</span>
                  <span class="metric-value">${appliance.room || 'General'}</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">Rated Power Draw</span>
                  <span class="metric-value highlight-amber">${ratedPower} W (${(ratedPower / 1000).toFixed(2)} kW)</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">Current Total System Load</span>
                  <span class="metric-value ${isOverload ? 'highlight-red' : 'metric-value'}">${totalLoadKw} kW</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">Safety Capacity Limit</span>
                  <span class="metric-value">3.00 kW</span>
                </div>
              </div>

              <p style="font-size: 13px; color: #94A3B8; line-height: 1.5; margin: 0 0 16px;">
                <strong>Trigger Reason:</strong> ${reasons.join(' • ')}.
              </p>
              <p style="font-size: 12px; color: #64748B; line-height: 1.4; margin: 0;">
                This proactive alert was dispatched automatically by ControlHub's safety engine to help prevent overloads and unexpected utility peaks.
              </p>
            </div>
            <div class="footer">
              ControlHub Smart Home Automation &copy; ${new Date().getFullYear()} &bull; Telemetry Monitoring Gateway
            </div>
          </div>
        </body>
        </html>
      `,
    };

    console.log(`[ALERT DISPATCH REAL TARGET] Sending to: ${mailOptions.to}`);

    let info;
    try {
      info = await transporter.sendMail(mailOptions);
      console.log(`[ALERT SUCCESS] Email delivered to ${mailOptions.to}`);
    } catch (sendErr) {
      console.error('[ALERT ERROR] Failed to send email:', sendErr.message);
      if (sendErr.code === 'EAUTH') {
        console.error('[AlertService] SMTP Authentication failure: Check SMTP_USER and SMTP_PASS credentials.');
      } else if (['ECONNREFUSED', 'ETIMEDOUT', 'ESOCKET'].includes(sendErr.code)) {
        console.error(`[AlertService] SMTP Connection failure (${sendErr.code}): Unable to connect to host/port.`);
      }
      throw sendErr;
    }

    const previewUrl = nodemailer.getTestMessageUrl(info) || null;

    console.log(`[AlertService] Dispatched email alert for "${appliance.name}" (Total Load: ${totalLoadKw} kW). Message ID: ${info.messageId}`);
    if (previewUrl) {
      console.log(`[AlertService] Ethereal Email Preview: ${previewUrl}`);
    }

    return {
      triggered: true,
      appliance: appliance.name,
      ratedPower,
      totalLoadKw,
      messageId: info.messageId,
      previewUrl,
    };
  } catch (err) {
    console.error('[ALERT ERROR] Failed to send email:', err.message);
    return {
      triggered: false,
      error: err.message,
    };
  }
}


