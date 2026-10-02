const sendMail = require('../utils/sendMail');
const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const verifyToken = require('../middleware/auth');
const User = require('../models/User');
const Idea = require('../models/Idea');
const upload = require('../middleware/multer'); 
const Draft = require('../models/Draft');

router.post('/', async (req, res) => {
  try {
    const {
      firstName,
      middleInitial, // optional
      lastName,
      email,
      password,
      confirmPassword, // frontend sends this; validate match
      role,
      industry,
      socials
    } = req.body;
    
    const emailLC = String(email || '').trim().toLowerCase();

    // Required checks
    if (!firstName || !lastName) {
      return res.status(400).json({ message: "First and last name are required." });
    }
    if (middleInitial && !/^[A-Za-z]$/.test(middleInitial)) {
      return res.status(400).json({ message: "Middle initial must be a single letter." });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: emailLC });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    // Business validation
    if (role === "business" && (!industry || industry.trim() === "")) {
      return res.status(400).json({ message: "Industry is required for business accounts." });
    }

    // Parse socials if provided
    let parsedSocials = {};
    if (socials !== undefined) {
      parsedSocials = typeof socials === 'string' ? JSON.parse(socials) : socials;
    }

    // Build legacy display name for backward compatibility
    const displayName = `${firstName}${middleInitial ? " " + middleInitial + "." : ""} ${lastName}`.trim();

    // Create user
    const user = new User({
      // new structured fields
      firstName,
      middleInitial, // optional
      lastName,

      //legacy single-string name (keep other parts of app working)
      name: displayName,

      role,
      email: emailLC,        // store lowercased
      password, // pre-save hook will hash
      industry: role === "business" ? industry : undefined,
      socials: parsedSocials
    });

    const savedUser = await user.save();

// --- Create verification CODE 
const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
const verifyExpires = Date.now() + 1000 * 60 * 60; // 1 hour

savedUser.verifyCode = verifyCode;
savedUser.verifyExpires = verifyExpires;
savedUser.verifyToken = undefined; // ensure no link token
await savedUser.save({ validateBeforeSave: false });

// Send code-only email (soft-fail if mailer has issues)
// Send code-only email (soft-fail if mailer has issues)
try {
  const textBody =
    `Hi ${firstName},

Your verification code is: ${verifyCode}
This code expires in 1 hour.`;

  await sendMail(
    savedUser.email,
    'Verify Your Account',
    `<p>Hi ${firstName},</p>
     <p>Your verification code is: <b>${verifyCode}</b></p>
     <p>This code expires in 1 hour.</p>`,
    textBody // <-- NEW
  );

  return res.status(201).json({
    message: "Signup successful. Verification email sent.",
    userId: savedUser._id,
    emailSent: true
  });
} catch (mailErr) {
  console.error("Verification email failed:", mailErr);
  return res.status(201).json({
    message: "Signup successful, but email couldn’t be sent. Use Resend on the Verify page.",
    userId: savedUser._id,
    emailSent: false
  });
}

  } catch (err) {
    console.error("Signup error:", err);
    return res.status(400).json({ error: err.message });
  }
});

// 🔑 Login and generate JWT token
router.post('/login', async (req, res) => {
  const emailLC = String(req.body.email || '').trim().toLowerCase();
  const { password } = req.body;

  try {
    const user = await User.findOne({ email: emailLC });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isVerified) {
      // Keep 403 so the frontend can redirect to /verify
      return res.status(403).json({ message: "Please verify your account before logging in." });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Login failed", error: err.message });
  }
});

//--- ACCOUNT VERIFICATION ---
router.post('/verify-code', async (req, res) => {
  const emailLC = String(req.body.email || '').trim().toLowerCase();
  const { code } = req.body;
  const user = await User.findOne({
    email: emailLC,
    verifyCode: code,
    verifyExpires: { $gt: Date.now() },
  });
  if (!user) return res.status(400).json({ message: "Invalid or expired verification code." });

  user.isVerified = true;
  user.verifyToken = undefined;
  user.verifyCode = undefined;
  user.verifyExpires = undefined;
  await user.save();

  res.json({ message: "Account verified successfully. You can now log in." });
});

// 🔁 Resend verification email
router.post('/send-verification', async (req, res) => {
const emailLC = String(req.body.email || '').trim().toLowerCase();
try {
  const user = await User.findOne({ email: emailLC });
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.isVerified) return res.status(400).json({ message: "User is already verified." });

  // CODE only (no token)
  const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
  const verifyExpires = Date.now() + 1000 * 60 * 60;

  user.verifyCode = verifyCode;
  user.verifyExpires = verifyExpires;
  user.verifyToken = undefined; // clear any old token
  await user.save({ validateBeforeSave: false });
  const textBody =
  `Your verification code is: ${verifyCode}
This code expires in 1 hour.`;
await sendMail(
  user.email,
  'Verify Your Account (Code)',
  `<p>Your verification code is: <b>${verifyCode}</b></p>
   <p>This code expires in 1 hour.</p>`,
  textBody 
);

  return res.status(200).json({ message: "Verification code resent." });
} catch (err) {
  console.error("Resend error:", err);
  return res.status(500).json({ message: "Error resending verification", error: err.message });
}
});

// DEV ONLY: peek verification code
router.get('/dev/peek-verify-code', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Not available in production' });
  }
  const emailLC = String(req.query.email || '').trim().toLowerCase();
  const user = await User.findOne({ email: emailLC }).select('email verifyCode verifyExpires isVerified');
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json({
    email: user.email,
    code: user.verifyCode,
    expiresAt: user.verifyExpires,
    isVerified: user.isVerified
  });
});


// 🔓 Get all users (public)
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ⭐ Toggle favorite (protected)
router.put("/favorite/:ideaId", verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { ideaId } = req.params;

  try {
    const idea = await Idea.findById(ideaId);
    if (!idea) return res.status(404).json({ message: "Idea not found." });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    const index = user.favorites.findIndex(f => f.toString() === ideaId);

    if (index === -1) {
      user.favorites.push(ideaId);
    } else {
      user.favorites.splice(index, 1);
    }

    await user.save();
    await user.populate("favorites"); // optional, but nice

    return res.status(200).json({ favorites: user.favorites });
  } catch (err) {
    console.error("Error toggling favorite:", err);
    return res.status(500).json({ message: "Error toggling favorite", error: err.message || err });
  }
});


// ⭐ Get all favorites (protected)
router.get("/favorites", verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId).populate("favorites");
    res.status(200).json({ favorites: user.favorites });
  } catch (err) {
    res.status(500).json({ message: "Error retrieving favorites", error: err });
  }
});

 // 👤 Get current logged-in user (protected)
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user", error: err.message });
  }
});

// ✅ Update Profile (including file upload) — supports structured names
router.put(
  '/profile',
  verifyToken,
  upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'coverPicture', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      // Allow both structured names and legacy `name`
      // If client sends structured fields, we use those; otherwise, accept `name`.
      let {
        firstName,
        middleInitial,
        lastName,
        name, // legacy
        bio,
        role,
        industry,
        socials,
      } = req.body;

      // If socials came as JSON string (multipart), parse it
      if (socials !== undefined && typeof socials === 'string') {
        try { socials = JSON.parse(socials); } catch { /* ignore parse error */ }
      }

      // Apply structured names if present
      const hasStructuredNames =
        (typeof firstName === 'string' && firstName.trim() !== '') ||
        (typeof lastName === 'string' && lastName.trim() !== '');

      if (hasStructuredNames) {
        if (firstName !== undefined) user.firstName = firstName.trim();
        if (middleInitial !== undefined) user.middleInitial = (middleInitial || '').toUpperCase().slice(0, 1);
        if (lastName !== undefined) user.lastName = lastName.trim();

        // Validate requireds if client is updating names
        if (!user.firstName || !user.lastName) {
          return res.status(400).json({ message: 'First and last name are required.' });
        }
        // `name` will be auto-rebuilt by the model pre-save hook
      } else if (name !== undefined) {
        // Legacy: if only `name` provided, just set it (hooks won’t split it)
        user.name = name;
      }

      if (bio !== undefined) user.bio = bio;

      if (role !== undefined) {
        const rl = String(role).toLowerCase();
        user.role = rl;
        if (rl === 'business') {
          if (industry !== undefined && String(industry).trim() !== '') {
            user.industry = industry;
          } else if (!user.industry) {
            return res.status(400).json({ message: 'Industry is required for business accounts.' });
          }
        } else {
          user.industry = undefined;
        }
      } else if (industry !== undefined && String(industry).trim() !== '') {
        // Allow updating industry independently if already business
        if (user.role === 'business') user.industry = industry;
      }

      if (socials !== undefined && typeof socials === 'object') {
        user.socials = socials;
      }

      // Files
      if (req.files?.profilePicture?.length) {
        user.profilePicture = '/uploads/' + req.files.profilePicture[0].filename;
      }
      if (req.files?.coverPicture?.length) {
        user.coverPicture = '/uploads/' + req.files.coverPicture[0].filename;
      }

      await user.save();
      res.json({ message: 'Profile updated successfully', user });
    } catch (err) {
      console.error('❌ Update error:', err);
      res.status(500).json({ message: 'Failed to update profile' });
    }
  }
);


// Remove profile or cover picture
router.put('/remove-picture', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { type } = req.body; // 'profile' or 'cover'

    if (type === 'profile') {
      user.profilePicture = '';
    } else if (type === 'cover') {
      user.coverPicture = '';
    } else {
      return res.status(400).json({ message: 'Invalid type' });
    }
    await user.save();
    res.json({ message: 'Picture removed successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove picture' });
  }
});

// 🔑 Request a password reset (email sends CODE ONLY — no link)
router.post('/forgot-password', async (req, res) => {
  const emailLC = String(req.body.email || '').trim().toLowerCase();
  const user = await User.findOne({ email: emailLC });
  if (!user) return res.status(404).json({ message: 'No user with that email.' });

  // Always keep the 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
  user.resetPasswordCode = code;
  user.resetPasswordExpires = Date.now() + 1000 * 60 * 60; // 1 hour

  await user.save({ validateBeforeSave: false });

  // Email link (code only)
  await sendMail(
    user.email,
    'Password Reset Request',
    `<p>You requested a password reset.<br>
    Use this 6-digit code in the app: <b>${code}</b><br>
    If you didn't request this, ignore this email.</p>`
  );

  res.json({ message: 'Reset code sent. Check your inbox.' });
});


// 🔒 Reset password using 6-digit code
router.post('/reset-password-code', async (req, res) => {
  const emailLC = String(req.body.email || '').trim().toLowerCase();
  const { code, password, confirmPassword } = req.body;

  if (!password || password.length < 8)
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  if (password !== confirmPassword)
    return res.status(400).json({ message: 'Passwords do not match.' });

  const user = await User.findOne({
    email: emailLC,
    resetPasswordCode: code,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) return res.status(400).json({ message: 'Invalid or expired code.' });

  user.password = password; // pre-save hook hashes
  user.resetPasswordToken = undefined;
  user.resetPasswordCode = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: 'Password reset successful. You can now log in.' });
});


// ⚠️ Delete a user by email (DEV USE ONLY)
router.delete("/delete", async (req, res) => {
  const emailLC = String(req.body.email || '').trim().toLowerCase();
  try {
    const deleted = await User.findOneAndDelete({ email: emailLC });
    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: `User with email ${email} deleted` });
  } catch (err) {
    res.status(500).json({ message: "Error deleting user", error: err.message });
  }
});

// design idea drafts saved for user (protected)

// Save a new draft
router.post('/drafts', verifyToken, async (req, res) => {
  try {
    const draft = new Draft({
      user: req.user.id,
      ...req.body
    });
    await draft.save();
    res.status(201).json(draft);
  } catch (err) {
    res.status(500).json({ message: "Error saving draft", error: err.message });
  }
});

// Get all drafts for the logged-in user
router.get('/drafts', verifyToken, async (req, res) => {
  try {
    const drafts = await Draft.find({ user: req.user.id }).sort({ updatedAt: -1 });
    res.json(drafts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching drafts", error: err.message });
  }
});

// Get a single draft by ID
router.get('/drafts/:id', verifyToken, async (req, res) => {
  try {
    const draft = await Draft.findOne({ _id: req.params.id, user: req.user.id });
    if (!draft) return res.status(404).json({ message: "Draft not found" });
    res.json(draft);
  } catch (err) {
    res.status(500).json({ message: "Error fetching draft", error: err.message });
  }
});

// Update a draft
router.put('/drafts/:id', verifyToken, async (req, res) => {
  try {
    const draft = await Draft.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!draft) return res.status(404).json({ message: "Draft not found" });
    res.json(draft);
  } catch (err) {
    res.status(500).json({ message: "Error updating draft", error: err.message });
  }
});

// Search users and ideas (protected)
router.get('/search/users', verifyToken, async (req, res) => {
  const q = req.query.q;
  const users = await User.find({
    name: { $regex: q, $options: 'i' }
  }).select('name _id');
  res.json(users);
});
// Search ideas by title or problem (protected)
router.get('/search/ideas', verifyToken, async (req, res) => {
  const q = req.query.q;
  const ideas = await Idea.find({
    $or: [
      { title: { $regex: q, $options: 'i' } },
      { problem: { $regex: q, $options: 'i' } },
    ]
  }).select('title _id');
  res.json(ideas);
});


// 🧨 Deactivate (delete) user account with password confirmation
router.post("/deactivate", verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { password } = req.body;

  if (!password)
    return res.status(400).json({ message: "Password is required to deactivate account." });

  try {
    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "User not found." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Incorrect password." });

    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "Account successfully deactivated." });
  } catch (err) {
    res.status(500).json({ message: "Failed to deactivate account", error: err.message });
  }
});

// ✅ VERIFY CURRENT PASSWORD
router.post("/verify-password", verifyToken, async (req, res) => {
  const { oldPassword } = req.body;

  if (!oldPassword) {
    return res.status(400).json({ message: "Old password is required." });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: "Incorrect old password." });

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Error verifying password", error: err.message });
  }
});

// ✅ RESET CURRENT PASSWORD (Updated for pre-save hook)
router.post("/reset-current-password", verifyToken, async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters." });
  }
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.password = newPassword; // <-- plain; model hook will hash
    await user.save();

    res.status(200).json({ message: "Password updated successfully." });
  } catch (err) {
    res.status(500).json({ message: "Error updating password", error: err.message });
  }
});

module.exports = router;
