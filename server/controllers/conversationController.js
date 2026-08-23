import Conversation from "../models/Conversation.js";
import User from "../models/User.js";

export const createConversation = async (req, res) => {
    
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        if (userId.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot chat with yourself",
            });
        }

        const otherUser = await User.findById(userId);

        if (!otherUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        let conversation = await Conversation.findOne({
            participants: {
                $all: [req.user._id, userId],
            },
        });

        if (conversation) {
            return res.status(200).json({
                success: true,
                conversation,
            });
        }

        conversation = await Conversation.create({
            participants: [req.user._id, userId],
        });

        res.status(201).json({
            success: true,
            message: "Conversation created",
            conversation,
        });
    } catch (error) {
        console.error("Create Conversation Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export const getConversations = async (req, res) => {

    try {
        const conversations = await Conversation.find({
            participants: req.user._id,
        })
            .populate("participants", "name email profileImage")
            .populate("lastMessage")
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            conversations,
        });
        
    } catch (error) {
        console.error("Get Conversations Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};