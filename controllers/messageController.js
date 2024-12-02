const Conversation = require ("../models/Conversation");
const Message = require ("../models/Message");





// getMessages Retrieves all messages from a specific conversation between the sender and the chat recipient.
const getMessages = async (req, res) => {
    try {
        const { id: chatRecipientId } = req.params;
        const senderId = req.userId; //req.userId is added by the verifyJWT middle ware in the messageRoute

        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, chatRecipientId] },
        }).populate({path: "messages",
            options: { sort: { createdAt: -1 }, limit: 15 }, // Sort by newest and limit to 15 messages
        });

        if (!conversation) {
            return res.status(404).json({ message: "No conversation found with this user" });
        }
        const chats = conversation.messages.reverse()

        res.status(200).json(chats);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve messages", details: error.message });
    }
};

// Handles sending messages between users.
// const sendMessage = async (req, res) => {
//     try {
//         const { message } = req.body;
//         const { id: receiverId } = req.params;
//         const senderId = req.userId;

//         let conversation = await Conversation.findOne({
//             participants: { $all: [senderId, receiverId] }
//         });

//         if (!conversation) {
//             conversation = await Conversation.create({
//                 participants: [senderId, receiverId],
//             });
//         }

//         const newMessage = new Message({
//             senderId,
//             receiverId,
//             message,
//         });

//         if (newMessage) {
//             conversation.messages.push(newMessage._id);
//         }

//         await Promise.all([conversation.save(), newMessage.save()]);

//         res.status(201).json({ message: "Message sent successfully" });
//     } catch (error) {
//         res.status(500).json({ error: "Failed to send message", details: error.message });
//     }
// };


const getConversations = async (req, res) => {
    try {
        const senderId = req.userId
        const conversations = await Conversation.find({participants: senderId})
        const sortedConversations = conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        if(conversations.length === 0){
            return res.status(404).json({message: "No conversations yet"})
        }
        res.status(200).json(sortedConversations)
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve dialogues", details: error.message });
    }
}


module.exports = {
    getMessages,
    // sendMessage,
    getConversations
};

