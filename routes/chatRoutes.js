const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const chatController = require("../Controller/chatController");

// Send
router.post("/send", verifyToken, chatController.sendMessage);

// Conversations
router.get("/conversations", verifyToken, chatController.getConversations);

// Messages (param is "<ndaId>_<otherUserId>")
router.get("/messages/:chatId", verifyToken, chatController.getMessages);

module.exports = router;
