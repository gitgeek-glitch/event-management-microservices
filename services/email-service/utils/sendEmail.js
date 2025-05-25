import transporter from "../config/mailConfig.js";

const sendEmail = async ({ to, subject, text, html }) => {
  const mailOptions = {
    from: `"Event Platform" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;
