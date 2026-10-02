const Nda = require("../models/nda");
const Idea = require("../models/Idea");

// Create a new NDA and link to idea
exports.createNda = async (req, res) => {
  try {
    const {
      disclosingPartyName,
      disclosingPartyAddress,
      disclosingPartyEmail,
      disclosingPartySignature,
      disclosingPartySignedDate,
      effectiveDate,
      ideaId,
    } = req.body;

    const nda = new Nda({
      disclosingPartyName,
      disclosingPartyAddress,
      disclosingPartyEmail,
      disclosingPartySignature,
      disclosingPartySignedDate,
      effectiveDate,
      idea: ideaId,
    });

    const savedNda = await nda.save();

    if (ideaId) {
      await Idea.findByIdAndUpdate(ideaId, { nda: savedNda._id });
    }

    res.status(201).json(savedNda);
  } catch (error) {
    console.error("Error creating NDA:", error);
    res.status(500).json({ error: "Server error creating NDA" });
  }
};

// Get NDA by ID
exports.getNda = async (req, res) => {
  try {
    const ndaId = req.params.id;
    const nda = await Nda.findById(ndaId).populate("idea");

    if (!nda) {
      return res.status(404).json({ error: "NDA not found" });
    }

    res.status(200).json(nda);
  } catch (error) {
    console.error("Error fetching NDA:", error);
    res.status(500).json({ error: "Server error fetching NDA" });
  }
};

// ✅ Get NDA status for current user for a given idea (via userId)
exports.getStatusForIdea = async (req, res) => {
  try {
    const { ideaId } = req.params;
    const userId = req.user.id;

    const nda = await Nda.findOne({ idea: ideaId }).populate({
      path: "idea",
      select: "createdBy",
      populate: { path: "createdBy", select: "name email" },
    });

    if (!nda) {
      return res
        .status(404)
        .json({ signed: false, message: "NDA not found for this idea." });
    }

    const isDiscloser =
      nda.idea?.createdBy?._id &&
      nda.idea.createdBy._id.toString() === userId;

    const isReceiver = (nda.receivingParties || []).some(
      (p) => p.userId && p.userId.toString() === userId
    );

    const signed = isDiscloser || isReceiver;

    return res.json({
      signed,
      role: isDiscloser ? "discloser" : isReceiver ? "receiver" : null,
      ndaId: nda._id,
      // useful contact bits for the UI:
      disclosingPartyName: nda.disclosingPartyName,
      disclosingPartyEmail: nda.disclosingPartyEmail,
      creatorId: nda.idea?.createdBy?._id,
      creatorName: nda.idea?.createdBy?.name,
      creatorEmail: nda.idea?.createdBy?.email,
    });
  } catch (err) {
    console.error("Error getting NDA status:", err);
    res.status(500).json({ error: "Server error getting NDA status" });
  }
};

// Business signs the NDA (Receiving Party)
exports.signReceivingParty = async (req, res) => {
  try {
    const ndaId = req.params.id;
    const userId = req.user.id;
    const {
      receivingPartyName,
      receivingPartyAddress,
      receivingPartyEmail,
      receivingPartySignature,
      receivingPartySignedDate,
    } = req.body;

    const nda = await Nda.findById(ndaId);
    if (!nda) {
      return res.status(404).json({ error: "NDA not found" });
    }

    const alreadySigned = nda.receivingParties?.some(
      (p) => p.userId?.toString() === userId
    );
    if (alreadySigned) {
      return res.status(400).json({ error: "You have already signed this NDA." });
    }

    nda.receivingParties.push({
      userId,
      name: receivingPartyName,
      address: receivingPartyAddress,
      email: receivingPartyEmail,
      signature: receivingPartySignature,
      signedDate: receivingPartySignedDate,
    });

    await nda.save();

    res
      .status(200)
      .json({ message: "NDA signed by receiving party successfully", nda });
  } catch (error) {
    console.error("Error signing NDA (receiving party):", error);
    res.status(500).json({ error: "Server error signing NDA" });
  }
};
