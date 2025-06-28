// webmailer/mailerService.js

const nodemailer = require('nodemailer');
const pool = require('../models/userModels');
const { decrypt } = require('../utils/encryption');
const { saveMail } = require('./models/mailHistoryModel');

async function sendMail(userId, { to, subject, html, attachment }) {
  const { rows } = await pool.query(
    'SELECT smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass_enc, smtp_from FROM users WHERE id = $1',
    [userId]
  );
  const user = rows[0];
  const smtpPass = decrypt(user.smtp_pass_enc);

const transporter = nodemailer.createTransport({
  host: user.smtp_host,
  port: Number(user.smtp_port),
  secure: Boolean(user.smtp_secure),
  auth: {
    user: user.smtp_user,
    pass: smtpPass
  },
  logger: false, // no transporter logs
  debug: false // no SMTP traffic debugging
});

  const mailOptions = {
    from: user.smtp_user,
    to,
    subject,
    html,
    attachments: attachment ? [{
      filename: attachment.originalname,
      path: attachment.path
    }] : []
  };

  await transporter.sendMail(mailOptions);
  await saveMail(userId, to, subject, html);
}

module.exports = { sendMail };
