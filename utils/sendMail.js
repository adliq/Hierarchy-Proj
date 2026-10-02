// utils/sendMail.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// Verify SMTP on boot (logs once)
transporter.verify((err, success) => {
  if (err) {
    console.error('❌ SMTP verify failed:', err.message || err);
  } else {
    console.log('✅ SMTP ready to send mail');
  }
});

async function sendMail(to, subject, html, text) {
  const info = await transporter.sendMail({
    from: `"Hierarchy" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text, 
  });
  console.log(`✉️  Mail queued -> to:${to} id:${info.messageId}`);
  return info;
}


module.exports = sendMail;
