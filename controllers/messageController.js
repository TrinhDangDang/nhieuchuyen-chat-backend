const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// getMessages Retrieves all messages from a specific conversation between the sender and the chat recipient.
const getMessages = async (req, res) => {
  try {
    const { id: chatRecipientId } = req.params;
    const senderId = req.userId; //req.userId is added by the verifyJWT middle ware in the messageRoute

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, chatRecipientId] },
    }).populate({
      path: "messages",
      options: { sort: { createdAt: -1 }, limit: 15 }, // Sort by newest and limit to 15 messages
    });

    if (!conversation) {
      return res.status(404).json({ message: "Start chatting" });
    }
    const chats = conversation.messages.reverse();

    res.status(200).json(chats);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to retrieve messages", details: error.message });
  }
};

const getConversations = async (req, res) => {
  try {
    const senderId = req.userId;
    const conversations = await Conversation.find({ participants: senderId });
    const sortedConversations = conversations.sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );
    if (conversations.length === 0) {
      return res.status(404).json({ message: "No conversations yet" });
    }
    res.status(200).json(sortedConversations);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to retrieve dialogues", details: error.message });
  }
};

const deleteConversation = async (req, res) => {
  try {
    const { id: chatRecipientId } = req.params;
    const senderId = req.userId;

    // Find the conversation
    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, chatRecipientId] },
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Delete all related messages
    await Message.deleteMany({ conversation: conversation._id });

    // Delete the conversation itself
    await Conversation.findByIdAndDelete(conversation._id);

    res.status(200).json({ message: "Conversation deleted successfully" });
  } catch (error) {
    res.status(500).json({
      error: "Failed to delete conversation",
      details: error.message,
    });
  }
};

module.exports = {
  getMessages,
  // sendMessage,
  getConversations,
  deleteConversation,
};
