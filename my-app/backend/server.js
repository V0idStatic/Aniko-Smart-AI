const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Nodemailer transporter using Gmail + App Password
let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true = SSL/TLS
  auth: {
    user: "roldancchristian@gmail.com",   // ✅ your Gmail
    pass: "ihmd kpcp njeu lnfs",          // ✅ your App Password
  },
});

// Route to send reply
app.post("/send-reply", async (req, res) => {
  const { to_email, subject, reply_message } = req.body;

  if (!to_email || !subject || !reply_message) {
    return res.json({ success: false, message: "Missing fields" });
  }

  try {
    await transporter.sendMail({
      from: '"Admin" <roldancchristian@gmail.com>',
      to: to_email,
      subject: subject,
      text: reply_message,
    });

    res.json({ success: true, message: "Reply sent successfully!" });
  } catch (err) {
    console.error("Error sending email:", err);
    res.json({ success: false, message: "Error sending email. Check backend logs." });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
