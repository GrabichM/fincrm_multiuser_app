// webmailer/mailerController.js

const { sendMail } = require('./mailerService');
const { getTemplatesByUser, saveTemplate } = require('./models/templateModel');
const { getHistoryByUser } = require('./models/mailHistoryModel');

exports.showMailerForm = async (req, res) => {
  const templates = await getTemplatesByUser(req.session.userId);
  res.render('webmailer/mailerView', {
    email: req.session.email,
    templates,
    successMessage: req.session.successMessage || null,
    errorMessage: req.session.errorMessage || null
  });

  delete req.session.successMessage;
  delete req.session.errorMessage;
};

exports.sendMailerEmail = async (req, res) => {
  const { to, subject, customName, customOrt } = req.body;
const rawMessage = req.body.message ?? '';
const attachment = req.file;

const personalizedHtml = rawMessage
  .replace(/\[Name\]/g, customName || '[Name]')
  .replace(/\[Ort\]/g, customOrt || '[Ort]');
  try {
    await sendMail(req.session.userId, {
  to,
  subject,
  html: personalizedHtml,
  attachment
});
    req.session.successMessage = `✅ E-Mail an ${to} gesendet.`;
  } catch (err) {
    req.session.errorMessage = `❌ Fehler: ${err.message}`;
  }
  res.redirect('/mailer');
};

exports.showTemplates = async (req, res) => {
  const templates = await getTemplatesByUser(req.session.userId);
  res.render('webmailer/templates', { templates });
};

exports.saveTemplate = async (req, res) => {
  const { id, name, subject, body } = req.body;

  if (id) {
    await pool.query(
      'UPDATE templates SET name = $1, subject = $2, body = $3 WHERE id = $4 AND user_id = $5',
      [name, subject, body, id, req.session.userId]
    );
  } else {
    await saveTemplate(req.session.userId, name, subject, body);
  }

  req.session.successMessage = '✅ Template gespeichert.';
  res.redirect('/mailer/templates');
};

exports.showHistory = async (req, res) => {
  const history = await getHistoryByUser(req.session.userId);
  res.render('webmailer/history', { history });
};