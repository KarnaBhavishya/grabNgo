// server/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const nodemailer = require('nodemailer');

// Validation Helper Functions
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  // Min 8 chars, 1 uppercase, 1 number
  return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
};

// 1. REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, mobile, password, confirmPassword, role } = req.body;

    // Standard Validations
    if (!name || !email || !mobile || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }

    if (mobile.length !== 10 || !/^\d+$/.test(mobile)) {
      return res.status(400).json({ message: 'Mobile number must be exactly 10 digits.' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long, contain at least 1 uppercase letter, and at least 1 number.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    // Check if email already exists
    const existingUsers = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save to Database
    const userRole = role || 'customer';
    const result = await db.query(
      'INSERT INTO users (name, email, mobile, password, role, is_verified, is_active) VALUES (?, ?, ?, ?, ?, 1, 1)',
      [name, email, mobile, hashedPassword, userRole]
    );

    // Generate JWT Token
    const payload = { id: result.insertId, name, email, role: userRole };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'grabngo_super_secret_session_key_9988', { expiresIn: '7d' });

    res.status(201).json({
      message: 'Registration successful!',
      token,
      user: { id: result.insertId, name, email, role: userRole }
    });

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// 2. LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Fetch user from DB
    const users = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const user = users[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Check if active
    if (!user.is_active) {
      return res.status(403).json({ message: 'Account is deactivated. Please contact support.' });
    }

    // Sign JWT Token
    const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'grabngo_super_secret_session_key_9988', { expiresIn: '7d' });

    res.json({
      message: 'Login successful!',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

router.post('/otp/send', async (req, res) => {
  const { mobile, email } = req.body;
  const simulatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

  // SMTP Settings
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT) || 587;

  let emailSent = false;
  let emailError = '';

  if (smtpUser && smtpPass && email) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          password: smtpPass
        }
      });

      const mailOptions = {
        from: `"GrabNGo Platforms" <${smtpUser}>`,
        to: email,
        subject: `⚡ GrabNGo OTP Verification Code: ${simulatedOtp}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #ff6b26 0%, #ff3b30 100%); padding: 32px 24px; text-align: center;">
              <div style="display: inline-block; background-color: #ffffff; color: #ff6b26; width: 42px; height: 42px; line-height: 42px; border-radius: 12px; font-weight: 900; font-size: 24px; margin-bottom: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); text-align: center;">G</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.03em;">GrabNGo OTP Verification</h1>
            </div>
            
            <!-- Body -->
            <div style="padding: 32px 24px; color: #1e293b;">
              <p style="font-size: 15px; line-height: 1.6; margin-top: 0; color: #334155;">Hello,</p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">Please use the secure, simulated OTP code below to verify your phone number and complete your session:</p>
              
              <!-- OTP Box -->
              <div style="background-color: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                <div style="font-size: 36px; font-weight: 800; letter-spacing: 0.2em; color: #ff6b26; margin: 0;">${simulatedOtp}</div>
                <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 8px;">Valid for 10 minutes</div>
              </div>

              <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin-bottom: 0;">If you did not request this OTP, please disregard this email safely.</p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f1f5f9; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8; font-weight: 600;">GrabNGo Inc. • Order Local. Pickup Fast.</p>
              <p style="margin: 4px 0 0; font-size: 10px; color: #cbd5e1;">© ${new Date().getFullYear()} GrabNGo. All rights reserved.</p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      emailSent = true;
      console.log(`✉️  [GrabNGo SMTP System] Real Email OTP sent to ${email} successfully!`);
    } catch (err) {
      console.error('❌ SMTP Mail Sending Error:', err.message);
      emailError = err.message;
    }
  }

  console.log(`🔥 [GrabNGo OTP System] OTP sent to ${mobile || email}: ${simulatedOtp} (SMTP Sent: ${emailSent ? 'YES' : 'NO'}${emailError ? ', Error: ' + emailError : ''})`);
  
  res.json({ 
    message: emailSent ? 'OTP has been dispatched to your email successfully!' : 'OTP generated and printed to console.', 
    tempOtp: simulatedOtp,
    emailSent
  });
});

router.post('/otp/verify', async (req, res) => {
  const { otp, expectedOtp } = req.body;
  if (otp === expectedOtp) {
    res.json({ success: true, message: 'OTP verified successfully!' });
  } else {
    res.status(400).json({ success: false, message: 'Invalid OTP code.' });
  }
});

module.exports = router;
