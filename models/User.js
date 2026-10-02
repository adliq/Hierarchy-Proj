const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Define schema for the User collection
const userSchema = new mongoose.Schema(
  {
    // New structured name fields
    firstName: {
      type: String,
      trim: true,
      required: function () { return this.isNew; }, // require on create
    },
    middleInitial: {
      type: String,
      trim: true,
      maxlength: 1, // optional single letter
    },
    lastName: {
      type: String,
      trim: true,
      required: function () { return this.isNew; }, // require on create
    },

    // Legacy display name (kept for compatibility throughout the app)
    name: {
      type: String,
      required: true,
    },

    // Account role: 'individual' or 'business'
    role: {
      type: String,
      enum: ["individual", "business"],
      required: true,
    },

    // Industry field for business users
    industry: {
      type: String,
      required: function () {
        return this.role === "business";
      },
    },

    // Unique email for login/identity
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Password (hashed before saving)
    password: {
      type: String,
      required: true,
      min: 8,
    },

    // --- Account verification fields ---
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifyToken: String,      // For verification by link
    verifyCode: String,       // For verification by code
    verifyExpires: Date,      // Expiration for token/code
    

    // --- Password reset token, code, and expiry (for forgot/reset password) ---
    resetPasswordToken: {
      type: String,
    },
    resetPasswordCode: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },

    // Optional profile photo URL
    profilePicture: {
      type: String,
      default: "",
    },

    // Optional cover photo URL
    coverPicture: {
      type: String,
      default: "",
    },

    // Bio/summary text for profile page
    bio: {
      type: String,
      default: "",
    },

    // Social media links (object of key/value pairs, e.g. { instagram, linkedin, twitter })
    socials: {
      type: Map,
      of: String,
      default: {},
    },

    // Ideas submitted by this user
    ideas: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Idea",
      },
    ],

    // Ideas this user has favorited
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Idea",
      },
    ],
  },
  { timestamps: true } // Adds createdAt and updatedAt fields
);

/**
 * Keep legacy `name` in sync.
 * - On create: if name missing but structured fields exist, build it.
 * - On update: if structured fields changed, rebuild name.
 */
function buildDisplayName(doc) {
  const fn = (doc.firstName || "").trim();
  const mi = (doc.middleInitial || "").trim();
  const ln = (doc.lastName || "").trim();
  if (!fn && !ln) return null;

  const mid = mi ? ` ${mi}.` : "";
  return `${fn}${mid} ${ln}`.trim();
}

userSchema.pre("validate", function (next) {
  // If name not set but we have structured fields, build it
  if (!this.name) {
    const built = buildDisplayName(this);
    if (built) this.name = built;
  }
  next();
});

userSchema.pre("save", function (next) {
  // If any structured field changed, refresh name
  if (this.isModified("firstName") || this.isModified("middleInitial") || this.isModified("lastName")) {
    const built = buildDisplayName(this);
    if (built) this.name = built;
  }
  next();
});

// 🔐 Automatically hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Export the User model for use throughout the backend
module.exports = mongoose.model("User", userSchema);
