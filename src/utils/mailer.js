// utils/mailer.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mjml from 'mjml';
import { Resend } from 'resend';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Send OTP Email Function
export const sendOtpEmail = async (email, otp) => {
  // Load MJML template
  const templatePath = path.join(__dirname, '../templates/otp.mjml');
  const mjmlTemplate = fs.readFileSync(templatePath, 'utf-8');

  // Inject OTP and convert to HTML
  const html = mjml(mjmlTemplate.replace('{{OTP_CODE}}', otp)).html;

  // Send email
  const result = await resend.emails.send({
    from: 'Ecommerce <website@resend.dev>', // ✅ Free Resend sender
    to: email,
    subject: 'Your OTP Code - Email Verification',
    html,
  });

  return result;
};
