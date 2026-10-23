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
    throw error;
  }
};

const sendRegistrationEmail = async (userEmail, name) => {
  const joinDate = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const subject = `🎉 Welcome to Backend Ledger, ${name}!`;

  const text = `
    Hi ${name},

    Welcome aboard! 🎉
    Your account has been successfully created.

    ──────────────────────────────
    👤 Name            : ${name}
    📧 Email           : ${userEmail}
    📅 Joined On       : ${joinDate}
    ──────────────────────────────

    Here's what you can do with Backend Ledger:
      ✅ Create multiple bank accounts
      ✅ Send & receive money instantly
      ✅ Track all transactions via ledger
      ✅ Multi-currency support

    If you did NOT create this account, please contact support immediately.

    Welcome to the family,
    Team Backend Ledger
  `;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="margin:0; padding:0; background-color:#f4f6f9; font-family: Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding: 40px 0;">

              <table width="500" cellpadding="0" cellspacing="0"
                style="background:#ffffff; border-radius:12px;
                       box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow:hidden;">

                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1a1a2e, #16213e);
                              padding: 30px; text-align:center;">
                    <h1 style="color:#00d4aa; margin:0; font-size:24px;
                               letter-spacing:1px;">🏦 Backend Ledger</h1>
                    <p style="color:#a0aec0; margin:6px 0 0; font-size:13px;">
                      Secure Banking System
                    </p>
                  </td>
                </tr>

                <!-- Welcome Badge -->
                <tr>
                  <td align="center" style="padding: 30px 0 10px;">
                    <div style="background:#e6fff9; border: 2px solid #00d4aa;
                                border-radius:50px; display:inline-block;
                                padding: 10px 24px;">
                      <span style="color:#00a87e; font-weight:bold; font-size:15px;">
                        🎉 Account Created Successfully
                      </span>
                    </div>
                  </td>
                </tr>

                <!-- Greeting -->
                <tr>
                  <td style="padding: 20px 40px 0;">
                    <p style="color:#2d3748; font-size:16px; margin:0;">
                      Hi <strong>${name}</strong>, Welcome aboard! 👋
                    </p>
                    <p style="color:#718096; font-size:14px; margin: 8px 0 0;">
                      Your Backend Ledger account has been successfully created.
                      Here's a summary of your account:
                    </p>
                  </td>
                </tr>

                <!-- Account Details Card -->
                <tr>
                  <td style="padding: 24px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background:#f7fafc; border-radius:10px;
                             border: 1px solid #e2e8f0;">

                      <tr>
                        <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                          <span style="color:#718096; font-size:13px;">👤 Full Name</span><br/>
                          <strong style="color:#1a202c; font-size:16px;">${name}</strong>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                          <span style="color:#718096; font-size:13px;">📧 Email</span><br/>
                          <strong style="color:#1a202c; font-size:16px;">${userEmail}</strong>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding: 16px 20px;">
                          <span style="color:#718096; font-size:13px;">📅 Joined On</span><br/>
                          <strong style="color:#1a202c; font-size:15px;">${joinDate}</strong>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>

                <!-- Features Section -->
                <tr>
                  <td style="padding: 0 40px 24px;">
                    <p style="color:#2d3748; font-weight:bold; font-size:14px; margin: 0 0 12px;">
                      🚀 What you can do with Backend Ledger:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background:#f7fafc; border-radius:10px;
                             border: 1px solid #e2e8f0;">

                      <tr>
                        <td style="padding: 12px 20px; border-bottom: 1px solid #e2e8f0;">
                          <span style="color:#00a87e;">✅</span>
                          <span style="color:#4a5568; font-size:14px;">
                            Create multiple bank accounts
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 20px; border-bottom: 1px solid #e2e8f0;">
                          <span style="color:#00a87e;">✅</span>
                          <span style="color:#4a5568; font-size:14px;">
                            Send & receive money instantly
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 20px; border-bottom: 1px solid #e2e8f0;">
                          <span style="color:#00a87e;">✅</span>
                          <span style="color:#4a5568; font-size:14px;">
                            Track all transactions via ledger
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 20px;">
                          <span style="color:#00a87e;">✅</span>
                          <span style="color:#4a5568; font-size:14px;">
                            Multi-currency support
                          </span>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>

                <!-- Warning -->
                <tr>
                  <td style="padding: 0 40px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background:#fff5f5; border-left: 4px solid #fc8181;
                             border-radius: 6px;">
                      <tr>
                        <td style="padding: 14px 16px;">
                          <p style="color:#c53030; font-size:13px; margin:0;">
                            ⚠️ <strong>Not you?</strong> If you did not create this account,
                            please contact our support team immediately.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f7fafc; padding: 20px 40px;
                             border-top: 1px solid #e2e8f0; text-align:center;">
                    <p style="color:#a0aec0; font-size:12px; margin:0;">
                      © ${new Date().getFullYear()} Backend Ledger. All rights reserved.
                    </p>
                    <p style="color:#a0aec0; font-size:12px; margin:6px 0 0;">
                      This is an automated email, please do not reply.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  await sendEmail(userEmail, subject, text, html);
};

//TRANSACTION
 
// if transaction success
const sendTransactionEmail = async (userEmail, name, amount, toAccount) => {
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);

  const transactionDate = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const subject = `✅ Transaction Successful — ${formattedAmount} Sent | Backend Ledger`;

  const text = `
    Hi ${name},

    Your transaction has been processed successfully.

    ──────────────────────────────
    💸 Amount Sent     : ${formattedAmount}
    🏦 To Account      : ${toAccount}
    📅 Date & Time     : ${transactionDate}
    ──────────────────────────────

    If you did NOT initiate this transaction, please contact support immediately.

    Stay safe,
    Team Backend Ledger
  `;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="margin:0; padding:0; background-color:#f4f6f9; font-family: Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding: 40px 0;">

              <table width="500" cellpadding="0" cellspacing="0"
                style="background:#ffffff; border-radius:12px;
                       box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow:hidden;">

                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1a1a2e, #16213e);
                              padding: 30px; text-align:center;">
                    <h1 style="color:#00d4aa; margin:0; font-size:24px;
                               letter-spacing:1px;">🏦 Backend Ledger</h1>
                    <p style="color:#a0aec0; margin:6px 0 0; font-size:13px;">
                      Secure Banking System
                    </p>
                  </td>
                </tr>

                <!-- Success Badge -->
                <tr>
                  <td align="center" style="padding: 30px 0 10px;">
                    <div style="background:#e6fff9; border: 2px solid #00d4aa;
                                border-radius:50px; display:inline-block;
                                padding: 10px 24px;">
                      <span style="color:#00a87e; font-weight:bold; font-size:15px;">
                        ✅ Transaction Successful
                      </span>
                    </div>
                  </td>
                </tr>

                <!-- Greeting -->
                <tr>
                  <td style="padding: 20px 40px 0;">
                    <p style="color:#2d3748; font-size:16px; margin:0;">
                      Hi <strong>${name}</strong>,
                    </p>
                    <p style="color:#718096; font-size:14px; margin: 8px 0 0;">
                      Your transaction has been processed successfully.
                      Here are your transaction details:
                    </p>
                  </td>
                </tr>

                <!-- Transaction Details Card -->
                <tr>
                  <td style="padding: 24px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background:#f7fafc; border-radius:10px;
                             border: 1px solid #e2e8f0;">

                      <tr>
                        <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                          <span style="color:#718096; font-size:13px;">💸 Amount Sent</span><br/>
                          <strong style="color:#1a202c; font-size:22px;">
                            ${formattedAmount}
                          </strong>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                          <span style="color:#718096; font-size:13px;">🏦 To Account</span><br/>
                          <strong style="color:#1a202c; font-size:15px;">
                            ${toAccount}
                          </strong>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding: 16px 20px;">
                          <span style="color:#718096; font-size:13px;">📅 Date & Time</span><br/>
                          <strong style="color:#1a202c; font-size:15px;">
                            ${transactionDate}
                          </strong>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>

                <!-- Warning -->
                <tr>
                  <td style="padding: 0 40px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background:#fff5f5; border-left: 4px solid #fc8181;
                             border-radius: 6px;">
                      <tr>
                        <td style="padding: 14px 16px;">
                          <p style="color:#c53030; font-size:13px; margin:0;">
                            ⚠️ <strong>Not you?</strong> If you did not initiate this
                            transaction, please contact our support team immediately.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f7fafc; padding: 20px 40px;
                             border-top: 1px solid #e2e8f0; text-align:center;">
                    <p style="color:#a0aec0; font-size:12px; margin:0;">
                      © ${new Date().getFullYear()} Backend Ledger. All rights reserved.
                    </p>
                    <p style="color:#a0aec0; font-size:12px; margin:6px 0 0;">
                      This is an automated email, please do not reply.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  await sendEmail(userEmail, subject, text, html);
};

// if transaction failed...
const sendTransactionFailureEmail = async (userEmail, name, amount) => {
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);

  const failedAt = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const subject = `❌ Transaction Failed — ${formattedAmount} | Backend Ledger`;

  const text = `
    Hi ${name},

    Unfortunately, your transaction could not be processed.

    ──────────────────────────────
    ❌ Amount           : ${formattedAmount}
    📅 Failed At        : ${failedAt}
    ⚠️  Status          : FAILED
    ──────────────────────────────

    Possible reasons:
      • Insufficient balance in your account
      • Account is frozen or closed
      • Network/server error during processing
      • Daily transaction limit exceeded

    What to do next:
      → Check your account balance
      → Ensure your account is active
      → Retry the transaction after some time
      → Contact support if issue persists

    Your money has NOT been deducted. No need to worry.

    We're sorry for the inconvenience,
    Team Backend Ledger
  `;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="margin:0; padding:0; background-color:#f4f6f9; font-family: Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding: 40px 0;">

              <table width="500" cellpadding="0" cellspacing="0"
                style="background:#ffffff; border-radius:12px;
                       box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow:hidden;">

                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1a1a2e, #16213e);
                              padding: 30px; text-align:center;">
                    <h1 style="color:#00d4aa; margin:0; font-size:24px;
                               letter-spacing:1px;">🏦 Backend Ledger</h1>
                    <p style="color:#a0aec0; margin:6px 0 0; font-size:13px;">
                      Secure Banking System
                    </p>
                  </td>
                </tr>

                <!-- Failed Badge -->
                <tr>
                  <td align="center" style="padding: 30px 0 10px;">
                    <div style="background:#fff5f5; border: 2px solid #fc8181;
                                border-radius:50px; display:inline-block;
                                padding: 10px 24px;">
                      <span style="color:#c53030; font-weight:bold; font-size:15px;">
                        ❌ Transaction Failed
                      </span>
                    </div>
                  </td>
                </tr>

                <!-- Greeting -->
                <tr>
                  <td style="padding: 20px 40px 0;">
                    <p style="color:#2d3748; font-size:16px; margin:0;">
                      Hi <strong>${name}</strong>,
                    </p>
                    <p style="color:#718096; font-size:14px; margin: 8px 0 0;">
                      Unfortunately, your transaction could not be processed.
                      Here are the details:
                    </p>
                  </td>
                </tr>

                <!-- Transaction Details Card -->
                <tr>
                  <td style="padding: 24px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background:#f7fafc; border-radius:10px;
                             border: 1px solid #e2e8f0;">

                      <tr>
                        <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                          <span style="color:#718096; font-size:13px;">💸 Amount</span><br/>
                          <strong style="color:#c53030; font-size:22px;">
                            ${formattedAmount}
                          </strong>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                          <span style="color:#718096; font-size:13px;">📅 Failed At</span><br/>
                          <strong style="color:#1a202c; font-size:15px;">${failedAt}</strong>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding: 16px 20px;">
                          <span style="color:#718096; font-size:13px;">⚠️ Status</span><br/>
                          <span style="background:#fff5f5; color:#c53030; font-weight:bold;
                                       font-size:13px; padding: 4px 12px; border-radius:20px;
                                       border: 1px solid #fc8181; display:inline-block;
                                       margin-top:4px;">
                            FAILED
                          </span>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>

                <!-- Possible Reasons -->
                <tr>
                  <td style="padding: 0 40px 24px;">
                    <p style="color:#2d3748; font-weight:bold; font-size:14px; margin: 0 0 12px;">
                      🔍 Possible Reasons:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background:#f7fafc; border-radius:10px;
                             border: 1px solid #e2e8f0;">
                      <tr>
                        <td style="padding: 12px 20px; border-bottom: 1px solid #e2e8f0;">
                          <span style="color:#e53e3e;">•</span>
                          <span style="color:#4a5568; font-size:14px;">
                            Insufficient balance in your account
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 20px; border-bottom: 1px solid #e2e8f0;">
                          <span style="color:#e53e3e;">•</span>
                          <span style="color:#4a5568; font-size:14px;">
                            Account is frozen or closed
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 20px; border-bottom: 1px solid #e2e8f0;">
                          <span style="color:#e53e3e;">•</span>
                          <span style="color:#4a5568; font-size:14px;">
                            Network or server error during processing
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 20px;">
                          <span style="color:#e53e3e;">•</span>
                          <span style="color:#4a5568; font-size:14px;">
                            Daily transaction limit exceeded
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- What to do next -->
                <tr>
                  <td style="padding: 0 40px 24px;">
                    <p style="color:#2d3748; font-weight:bold; font-size:14px; margin: 0 0 12px;">
                      👉 What to do next:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background:#f7fafc; border-radius:10px;
                             border: 1px solid #e2e8f0;">
                      <tr>
                        <td style="padding: 12px 20px; border-bottom: 1px solid #e2e8f0;">
                          <span style="color:#00a87e;">→</span>
                          <span style="color:#4a5568; font-size:14px;">
                            Check your account balance
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 20px; border-bottom: 1px solid #e2e8f0;">
                          <span style="color:#00a87e;">→</span>
                          <span style="color:#4a5568; font-size:14px;">
                            Ensure your account is active
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 20px; border-bottom: 1px solid #e2e8f0;">
                          <span style="color:#00a87e;">→</span>
                          <span style="color:#4a5568; font-size:14px;">
                            Retry the transaction after some time
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 20px;">
                          <span style="color:#00a87e;">→</span>
                          <span style="color:#4a5568; font-size:14px;">
                            Contact support if the issue persists
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Money Safe Banner -->
                <tr>
                  <td style="padding: 0 40px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background:#e6fff9; border-left: 4px solid #00d4aa;
                             border-radius: 6px;">
                      <tr>
                        <td style="padding: 14px 16px;">
                          <p style="color:#00a87e; font-size:13px; margin:0;">
                            🛡️ <strong>Your money is safe!</strong> No amount has been
                            deducted from your account. The transaction has been fully rolled back.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f7fafc; padding: 20px 40px;
                             border-top: 1px solid #e2e8f0; text-align:center;">
                    <p style="color:#a0aec0; font-size:12px; margin:0;">
                      © ${new Date().getFullYear()} Backend Ledger. All rights reserved.
                    </p>
                    <p style="color:#a0aec0; font-size:12px; margin:6px 0 0;">
                      This is an automated email, please do not reply.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  await sendEmail(userEmail, subject, text, html);
};

module.exports = {
  sendRegistrationEmail,
  sendTransactionEmail,
  sendTransactionFailureEmail,
};
