// webmailer/models/mailHistoryModel.js

const pool = require('../../models/userModels');

async function saveMail(userId, recipient, subject, html) {
  await pool.query(
    'INSERT INTO mail_history (user_id, recipient, subject, body) VALUES ($1, $2, $3, $4)',
    [userId, recipient, subject, html]
  );
}

async function getHistoryByUser(userId) {
  const { rows } = await pool.query(
    'SELECT recipient, subject, sent_at FROM mail_history WHERE user_id = $1 ORDER BY sent_at DESC',
    [userId]
  );
  return rows;
}

module.exports = { saveMail, getHistoryByUser };
