const Nda = require("../models/nda");
const User = require("../models/User");

/**
 * Get all NDAs signed by the current user (as a receiving party)
 */
exports.getSignedNdas = async (req, res) => {
  const userId = req.user.id;

  try {
    const signedNdas = await Nda.find({
      "receivingParties.userId": userId,
    }).populate("idea", "title");

    res.status(200).json(signedNdas);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch signed NDAs", error: err.message });
  }
};

/**
 * Placeholder for MDA functionality (similar logic to NDA)
 */
exports.getSignedMdas = async (req, res) => {
  // If you plan to support MDA later, define a similar model like nda.js
  res.status(200).json({
    message: "No MDA functionality implemented yet.",
    mdas: [],
  });
};

/**
 * Serve static terms & conditions content
 */
exports.getTerms = (req, res) => {
  const terms = `
  Hierarchy Terms & Conditions

  By using this application, you agree to:
  - Respect confidentiality agreements
  - Use submitted ideas responsibly
  - Abide by all platform policies and community guidelines
  
  These terms may be updated at any time.
  `;

  res.status(200).json({ terms });
};

/**
 * Get display preferences (extend later if needed)
 */
exports.getDisplaySettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("profilePicture coverPicture bio");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      profilePicture: user.profilePicture,
      coverPicture: user.coverPicture,
      bio: user.bio,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load display settings", error: err.message });
  }
};

/**
 * Update display preferences (profile pic, cover pic, bio)
 */
exports.updateDisplaySettings = async (req, res) => {
  const { profilePicture, coverPicture, bio } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture, coverPicture, bio },
      { new: true }
    ).select("profilePicture coverPicture bio");

    res.status(200).json({
      message: "Display settings updated",
      displaySettings: user,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update display settings", error: err.message });
  }
};
