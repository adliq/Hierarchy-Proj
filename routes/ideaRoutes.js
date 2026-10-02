const express = require("express");
const router = express.Router();
const Idea = require("../models/Idea");
const User = require("../models/User");
const nda = require("../models/nda");
const verifyToken = require("../middleware/auth");
const upload = require("../middleware/multer"); 


// ---------- CREATE IDEA (with file attachments + NDA) ----------
router.post(
  "/",
  verifyToken,
  upload.array("attachments", 10), // Accept up to 10 files per idea (adjust as needed)
  async (req, res) => {
    try {
      const userId = req.user.id;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const ideasThisWeek = await Idea.countDocuments({
        createdBy: userId,
        createdAt: { $gte: oneWeekAgo },
      });

      if (ideasThisWeek >= 4) {
        return res
          .status(429)
          .json({ error: "Post limit reached. You can only post 4 ideas per week." });
      }

      // For attachments
      let attachments = [];
      if (req.files && req.files.length > 0) {
        attachments = req.files.map((file) => ({
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          path: "/uploads/" + file.filename,
          size: file.size,
        }));
      }

      // Required fields
      const { title, summary, details, category, visibility, tags } = req.body;
      if (!title || !summary || !details || !category || !visibility) {
        return res.status(400).json({
          error: "Missing required fields: title, summary, details, category, or visibility.",
        });
      }

      // Support JSON array string for tags if sent via FormData
      let parsedTags = [];
      if (tags) {
        if (typeof tags === "string") {
          try {
            parsedTags = JSON.parse(tags);
          } catch {
            parsedTags = [tags]; // fallback: treat as single tag string
          }
        } else if (Array.isArray(tags)) {
          parsedTags = tags;
        }
      }

      const ideaData = {
        title,
        summary,
        details,
        category,
        visibility,
        tags: parsedTags,
        createdBy: userId,
        attachments, // <-- Store attachments in idea
      };

      // Handle visibleToIndustries if included
      if (visibility === "industry" && req.body.visibleToIndustries) {
        let industries = req.body.visibleToIndustries;
        if (typeof industries === "string") {
          try {
            industries = JSON.parse(industries);
          } catch {
            industries = [industries];
          }
        }
        ideaData.visibleToIndustries = industries;
      }

      // --- CREATE IDEA FIRST (without NDA ref) ---
      const idea = new Idea(ideaData);
      const savedIdea = await idea.save();

      // --- ALWAYS CREATE NDA AND LINK IT ---
      const user = await User.findById(userId);
      const ndaObj = new nda({
        disclosingPartyName: user.name || "Disclosing Party",
        disclosingPartyAddress: "Enter company address here", // TODO: you can ask for this in the frontend
        disclosingPartyEmail: user.email,
        disclosingPartySignature: user.name || "Signature",
        disclosingPartySignedDate: new Date(),
        effectiveDate: new Date(),
        idea: savedIdea._id,
        agreementText: undefined // will use the default NDA text
      });
      const savedNda = await ndaObj.save();

      // Link NDA to idea
      savedIdea.nda = savedNda._id;
      await savedIdea.save();

      // Respond with the idea including NDA ref
      res.status(201).json(savedIdea);
    } catch (err) {
      console.error("Error creating idea:", err);
      res.status(400).json({ error: err.message });
    }
  }
);

// ----------- GET ALL VISIBLE IDEAS -----------
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const currentUser = await User.findById(userId);

    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    let filter = {};

    if (currentUser.role === "business") {
      filter = {
        $or: [
          { visibility: "allIndustries" },
          { visibility: "industry", visibleToIndustries: { $in: [currentUser.industry] } }
        ]
      };
    } else {
      filter = { visibility: "allIndustries" };
    }

    const ideas = await Idea.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json(ideas);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ideas", details: err.message });
  }
});

// ----------- GET IDEAS BY CURRENT USER -----------
router.get("/mine", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const ideas = await Idea.find({ createdBy: userId })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json(ideas);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch your ideas", details: err.message });
  }
});

// ----------- GET SINGLE IDEA (w/ NDA logic) -----------
router.get("/:id", verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    const idea = await Idea.findById(req.params.id).populate("createdBy", "name email");

    if (!idea) {
      return res.status(404).json({ error: "Idea not found" });
    }

    const isCreator = idea.createdBy._id.toString() === userId;

    // NDA check for this idea
    const ndaRecord = await nda.findOne({ idea: idea._id });
    const ndaSigned = ndaRecord?.receivingParties?.some(
      (party) => party.userId.toString() === userId
    );

    if (isCreator || ndaSigned) {
      return res.json(idea);
    }

    // Limited info if not creator/NDA
    const limitedIdea = {
      _id: idea._id,
      title: idea.title,
      summary: idea.summary,
      category: idea.category,
      tags: idea.tags,
      createdAt: idea.createdAt,
      createdBy: idea.createdBy,
      visibility: idea.visibility,
      visibleToIndustries: idea.visibleToIndustries,
      ndaRequired: true,
      message: "NDA required to view full details",
    };

    return res.json(limitedIdea);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch idea", details: err.message });
  }
});

// ----------- SEARCH & FILTER IDEAS -----------
router.get("/search", async (req, res) => {
  try {
    const { tag, category, visibility, createdBy, q } = req.query;

    const filter = {};

    if (tag) filter.tags = { $in: [tag] };
    if (category) filter.category = category;
    if (visibility) filter.visibility = visibility;
    if (createdBy) filter.createdBy = createdBy;
    if (q) filter.$text = { $search: q };

    const ideas = await Idea.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json(ideas);
  } catch (err) {
    res.status(500).json({ error: "Search failed", details: err.message });
  }
});

// ----------- DELETE IDEA BY LOGGED-IN USER -----------
router.delete("/:id", verifyToken, async (req, res) => {
  const ideaID = req.params.id;

  try {
    const idea = await Idea.findById(ideaID);
    if (!idea) return res.status(404).json({ error: "Idea not found" });

    if (idea.createdBy.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Unauthorized: You can only delete your own ideas" });
    }

    await idea.deleteOne();
    res.json({ success: true, message: "Idea deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete idea", details: err.message });
  }
});

// ----------- DEV DELETE (NO AUTH) -----------
router.delete("/dev-delete/:id", async (req, res) => {
  try {
    const idea = await Idea.findByIdAndDelete(req.params.id);
    if (!idea) return res.status(404).json({ error: "Idea not found" });
    res.json({ success: true, message: "Idea deleted (dev only)" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete idea", details: err.message });
  }
});

module.exports = router;
