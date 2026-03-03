const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  // transporter -> it contacts with the google SMTP server
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Error connecting to email server:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Backend Ledger" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("Error sending email:", error);
    throw error; // ✅ Bug 3 Fixed: re-throw so caller knows it failed
  }
};

const sendRegistrationEmail = async (userEmail, name) => {
  const subject = "Welcome to Backend Ledger";
  const text = `Hello ${name}.\n\nThank you for registering at Backend Ledger.`; // ✅ Bug 1 Fixed
  const html = `<p>Hello ${name},</p><p>Thank you for registering at Backend Ledger.</p>`; // ✅ Bug 2 Fixed
  await sendEmail(userEmail, subject, text, html);
};

module.exports = { sendEmail, sendRegistrationEmail };
