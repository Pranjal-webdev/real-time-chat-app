import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import { getIO } from "../socket/socket.js";

export const sendMessage = async (req, res) => {
    try {
        const { conversationId, text } = req.body;

        if (!conversationId || !text?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Conversation ID and message text are required",
            });
        }

        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found",
            });
        }

        const isParticipant = conversation.participants.some(
            (participant) =>
                participant.toString() === req.user._id.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: "You are not a participant of this conversation",
            });
        }

        const message = await Message.create({
            conversation: conversationId,
            sender: req.user._id,
            text: text.trim(),
        });

        conversation.lastMessage = message._id;
        conversation.lastMessageAt = message.createdAt;

        await conversation.save();

        const populatedMessage = await Message.findById(message._id)
            .populate("sender", "name email profileImage");

        const io = getIO();

            io.to(`conversation:${conversationId}`).emit(
            "newMessage",
            populatedMessage
        );

        res.status(201).json({
            success: true,
            message: populatedMessage,
        });

    } catch (error) {

        console.error("Send Message Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export const getMessages = async (req, res) => {
    
    try {
        const { conversationId } = req.params;

        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found",
            });
        }

        const isParticipant = conversation.participants.some(
            (participant) =>
                participant.toString() === req.user._id.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: "You are not a participant of this conversation",
            });
        }

        const messages = await Message.find({
            conversation: conversationId,
        })
            .populate("sender", "name email profileImage")
            .sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            messages,
        });
    } catch (error) {
        console.error("Get Messages Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};