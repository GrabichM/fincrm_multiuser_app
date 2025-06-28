// utils/templateEngine.js

const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

function renderTemplate(templateName, data) {
  const templatesDir = path.resolve(__dirname, "../templates");
  const subjectTpl = fs.readFileSync(
    path.join(templatesDir, `${templateName}.subject.hbs`),
    "utf-8",
  );
  const htmlTpl = fs.readFileSync(
    path.join(templatesDir, `${templateName}.html.hbs`),
    "utf-8",
  );
  const textTpl = fs.readFileSync(
    path.join(templatesDir, `${templateName}.text.hbs`),
    "utf-8",
  );

  return {
    subject: Handlebars.compile(subjectTpl)(data),
    html: Handlebars.compile(htmlTpl)(data),
    text: Handlebars.compile(textTpl)(data),
  };
}

module.exports = { renderTemplate };

// utils/templateEngine.js Ende
