// webmailer/models/templateModel.js

const pool = require('../../models/userModels');

async function getTemplatesByUser(userId) {
  const { rows } = await pool.query(
    'SELECT id, name, subject, body FROM templates WHERE user_id = $1 ORDER BY name',
    [userId]
  );
  return rows;
}

async function saveTemplate(userId, name, subject, body) {
  await pool.query(`
    INSERT INTO templates (user_id, name, subject, body)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id, name) DO UPDATE
    SET subject = EXCLUDED.subject, body = EXCLUDED.body
  `, [userId, name, subject, body]);
}

module.exports = { getTemplatesByUser, saveTemplate };
