const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const {
  getMessages,
  sendMessage,
  getConversations,
  deleteConversation,
} = require("../controllers/messageController");

// Middleware to verify JWT for all routes
router.use(verifyJWT);

//Route to get past dialogues
router.get("/dialogues", getConversations);

// Route to retrieve messages for a conversation
router.get("/:id", getMessages);

router.delete("/conversation/:id", deleteConversation);

module.exports = router;
