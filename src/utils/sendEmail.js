const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      
  });

  await transporter.sendMail({
    from: `"Chat App" <${process.env.SMTP_MAIL}>`,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
