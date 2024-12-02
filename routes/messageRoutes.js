const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const { getMessages, sendMessage, getConversations } = require("../controllers/messageController");

// Middleware to verify JWT for all routes
router.use(verifyJWT);

//Route to get past dialogues
router.get("/dialogues", getConversations);


// Route to retrieve messages for a conversation
router.get("/:id", getMessages);

// Route to send a new message in a conversation
// router.post("/send/:id", sendMessage);
//commented out because i switch to socket io for real time chatting


module.exports = router;
