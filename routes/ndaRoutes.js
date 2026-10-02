const express = require("express");
const router = express.Router();
const ndaController = require("../Controller/ndaController");
const verifyToken = require("../middleware/auth");
const NDA = require("../models/nda");

// Create NDA
router.post("/", verifyToken, ndaController.createNda);

// Check NDA status for current user for a specific idea
router.get("/status/:ideaId", verifyToken, ndaController.getStatusForIdea);

// Get NDA by ID
router.get("/:id", verifyToken, ndaController.getNda);

// Business (receiving party) signs NDA
router.put("/:id/sign-receiving", verifyToken, ndaController.signReceivingParty);

// ✅ Get all NDAs relevant to the logged-in user (receiver by userId)
// (Your auth middleware only sets req.user.id, not email.)
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const ndas = await NDA.find({
      "receivingParties.userId": userId,
    })
      .populate({
        path: "idea",
        populate: { path: "createdBy", select: "name email" },
      })
      .lean();

    res.json(ndas);
  } catch (err) {
    console.error("Error fetching NDAs:", err);
    res.status(500).json({ error: "Server error fetching NDAs" });
  }
});

module.exports = router;
