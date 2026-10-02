const Message = require("../models/Message");
const Nda = require("../models/nda");
const User = require("../models/User");

// 🔄 Send a message between users (only allowed if sender is creator or recipient under NDA)
exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, text, ndaId } = req.body;
    const senderId = req.user.id;

    if (!recipientId || !text || !ndaId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const nda = await Nda.findById(ndaId);
    if (!nda) return res.status(404).json({ error: "NDA not found" });

    const sender = await User.findById(senderId);
    const senderIsRecipient = nda.receivingParties.some(
      (p) => p.userId.toString() === senderId
    );
    const senderIsCreator =
      nda.disclosingPartyEmail.toLowerCase() === sender.email.toLowerCase();

    if (!senderIsRecipient && !senderIsCreator) {
      return res.status(403).json({ error: "You are not authorized to send messages under this NDA" });
    }

    const message = new Message({
      sender: senderId,
      recipient: recipientId,
      text,
      nda: ndaId,
    });

    await message.save();
    res.status(201).json({ message: "Message sent", data: message });
  } catch (err) {
    res.status(500).json({ error: "Failed to send message", details: err.message });
  }
};

// 📥 Fetch conversations (message threads + NDA-signed pairs) with previews
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1) Threads that already have messages
    const messages = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }],
    })
      .populate("sender", "name email profilePicture")
      .populate("recipient", "name email profilePicture")
      .sort({ createdAt: 1 }); // oldest -> newest so last write wins

    const convosByKey = {};

    messages.forEach((msg) => {
      const otherUser =
        msg.sender._id.toString() === userId ? msg.recipient : msg.sender;
      const ndaId = String(msg.nda);
      const key = `${ndaId}_${otherUser._id}`;

      convosByKey[key] = {
        nda: ndaId,
        user: otherUser,
        lastMessageAt: msg.createdAt,
        lastMessageText: msg.text,
        hasMessages: true,
      };
    });

    // 2) NDA-signed pairs (even if no messages yet)
    const ndas = await Nda.find({
      $or: [
        { disclosingPartyEmail: req.user.email },  // current user is discloser
        { "receivingParties.userId": userId },     // or a receiver
      ],
    }).populate({
      path: "idea",
      select: "createdBy",
      populate: { path: "createdBy", select: "name email profilePicture" },
    });

    for (const n of ndas) {
      const ndaId = String(n._id);
      const isDiscloser =
        (n.disclosingPartyEmail || "").toLowerCase() === (req.user.email || "").toLowerCase();

      if (isDiscloser) {
        for (const rp of n.receivingParties || []) {
          const key = `${ndaId}_${rp.userId}`;
          if (!convosByKey[key]) {
            const otherUser = await User.findById(rp.userId).select("name email profilePicture");
            if (!otherUser) continue;
            convosByKey[key] = {
              nda: ndaId,
              user: otherUser,
              lastMessageAt: null,
              lastMessageText: "",
              hasMessages: false,
            };
          }
        }
      } else {
        const otherUser = n.idea?.createdBy; // populated user doc (discloser)
        if (otherUser) {
          const key = `${ndaId}_${otherUser._id}`;
          if (!convosByKey[key]) {
            convosByKey[key] = {
              nda: ndaId,
              user: otherUser,
              lastMessageAt: null,
              lastMessageText: "",
              hasMessages: false,
            };
          }
        }
      }
    }

    const result = Object.values(convosByKey).sort((a, b) => {
      const aT = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bT = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bT - aT;
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch conversations", details: err.message });
  }
};


// 📨 Fetch messages for a specific chat (NDA + user combo)
exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params; // Expected format: ndaId_userId
    const [ndaId, otherUserId] = chatId.split("_");
    const userId = req.user.id;

    if (!ndaId || !otherUserId) {
      return res.status(400).json({ error: "Invalid chat ID format." });
    }

    const messages = await Message.find({
      nda: ndaId,
      $or: [
        { sender: userId, recipient: otherUserId },
        { sender: otherUserId, recipient: userId },
      ],
    })
      .populate("sender", "name email profilePicture")
      .populate("recipient", "name email profilePicture")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages", details: err.message });
  }
};
