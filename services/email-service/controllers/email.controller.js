import sendEmail from "../utils/sendEmail.js";

export const sendEventEmail = async (req, res) => {
  const { to, subject, message } = req.body;

  if (!to || !subject || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    await sendEmail({
      to,
      subject,
      text: message,
      html: `<p>${message}</p>`,
    });

    res.status(200).json({ message: "Email sent successfully" });
  } catch (err) {
    console.error("Failed to send email:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
};
