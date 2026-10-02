const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const settingsController = require("../Controller/settingsController");

// 📄 Get all signed NDAs by the logged-in user
router.get("/signed-ndas", verifyToken, settingsController.getSignedNdas);

// 📄 Get all signed MDAs by the logged-in user
router.get("/signed-mdas", verifyToken, settingsController.getSignedMdas);

// 📜 Get Terms and Conditions (static for now)
router.get("/terms", settingsController.getTerms);

// 💡 Get current display preferences (could be expanded later)
router.get("/display", verifyToken, settingsController.getDisplaySettings);

// ✏️ Update display preferences
router.put("/display", verifyToken, settingsController.updateDisplaySettings);

module.exports = router;
