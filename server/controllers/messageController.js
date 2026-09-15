import mongoose from "mongoose";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import { getIO } from "../socket/socket.js";

export const sendMessage = async (req, res) => {

    try {
        const { conversationId, text, replyTo } = req.body;
        const isImage = req.body.isImage === true || req.body.isImage === "true";

        if (!conversationId || !text?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Conversation ID and message text are required",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid conversation ID",
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
            isImage,
            replyTo: replyTo || null,
            messageType: isImage ? "image" : "text",
            fileUrl: null,
            fileName: null
        });

        await Conversation.findByIdAndUpdate(
            conversationId,
            {
                lastMessage: message._id,
                lastMessageAt: message.createdAt,
            }
        );

        const populatedMessage = await Message.findById(message._id)
            .populate("sender", "name email profileImage")
            .populate({
                path: "replyTo",
                populate: {
                    path: "sender",
                    select: "name email profileImage",
                },
            });

        console.log("EMITTING ATTACHMENT:", populatedMessage._id);

        const io = getIO();

        io.to(`conversation:${conversationId}`).emit(
            "newMessage",
            populatedMessage
        );

        res.status(201).json({
            success: true,
            message: populatedMessage
        });

    } catch (error) {

        console.error("Send Message Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getMessages = async (req, res) => {

    try {
        const { conversationId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid conversation ID",
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

        await Message.updateMany(
            {
                conversation: conversationId,
                sender: { $ne: req.user._id },
                $or: [
                    { read: false },
                    { isRead: false }
                ],
            },
            {
                $set: {
                    read: true,
                    isRead: true,
                }
            }
        );

        const io = getIO();

        io.to(`conversation:${conversationId}`).emit(
            "messagesRead",
            {
                conversationId,
                userId: req.user._id,
            }
        );

        const messages = await Message.find({
            conversation: conversationId,
        })
            .populate("sender", "name email profileImage")
            .populate({
                path: "replyTo",
                populate: {
                    path: "sender",
                    select: "name email profileImage",
                },
            })
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


export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid message ID",
            });
        }

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found",
            });
        }

        const conversation = await Conversation.findById(message.conversation);

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

        if (message.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can delete only your own messages",
            });
        }

        await Message.findByIdAndDelete(messageId);

        res.status(200).json({
            success: true,
            message: "Message deleted successfully",
            messageId,
        });

    } catch (error) {
        console.error("Delete Message Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export const editMessage = async (req, res) => {
    try {
        const { messageId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid message ID",
            });
        }

        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message text is required",
            });
        }

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found",
            });
        }

        const conversation = await Conversation.findById(message.conversation);

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


        if (message.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can edit only your own messages",
            });
        }

        message.text = text.trim();
        message.isEdited = true;

        await message.save();

        res.status(200).json({
            success: true,
            message: "Message updated successfully",
            updatedMessage: message,
        });

    } catch (error) {
        console.error("Edit Message Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};


export const uploadMessage = async (req, res) => {
    try {
        const { conversationId } = req.body;

        if (!conversationId) {
            return res.status(400).json({
                success: false,
                message: "Conversation ID is required",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid conversation ID",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "File is required",
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

        const isImage =
            req.file.mimetype.startsWith("image/");

        const message = await Message.create({
            conversation: conversationId,
            sender: req.user._id,
            text: "",
            messageType: isImage ? "image" : "file",
            fileUrl: `/uploads/${req.file.filename}`,
            fileName: req.file.originalname,
        });

        await Conversation.findByIdAndUpdate(
            conversationId,
            {
                lastMessage: message._id,
                lastMessageAt: message.createdAt,
            }
        );


        const populatedMessage =
            await Message.findById(message._id)
                .populate(
                    "sender",
                    "name email profileImage"
                )
                .populate({
                    path: "replyTo",
                    populate: {
                        path: "sender",
                        select: "name email profileImage",
                    },
                });

        res.status(201).json({
            success: true,
            message: populatedMessage,
        });

    } catch (error) {
        console.error(
            "Upload Message Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};


export const reactToMessage = async (req, res) => {
    try {
        const { emoji } = req.body;
        const { messageId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid message ID",
            });
        }

        if (!emoji) {
            return res.status(400).json({
                success: false,
                message: "Emoji is required",
            });
        }

        const message = await Message.findById(messageId);

        const conversation = await Conversation.findById(message.conversation);

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

        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found",
            });
        }

        const existingReaction = message.reactions.find(
            (reaction) =>
                reaction.user.toString() ===
                req.user._id.toString()
        );

        if (existingReaction) {
            if (existingReaction.emoji === emoji) {
                message.reactions =
                    message.reactions.filter(
                        (reaction) =>
                            reaction.user.toString() !==
                            req.user._id.toString()
                    );
            } else {
                existingReaction.emoji = emoji;
            }
        } else {
            message.reactions.push({
                user: req.user._id,
                emoji,
            });
        }

        await message.save();

        const updatedMessage =
            await Message.findById(messageId)
                .populate(
                    "sender",
                    "name email profileImage"
                )
                .populate(
                    "reactions.user",
                    "name"
                );

        const io = getIO();

        io.to(
            `conversation:${message.conversation}`
        ).emit(
            "messageReaction",
            updatedMessage
        );

        res.status(200).json({
            success: true,
            message: updatedMessage,
        });

    } catch (error) {
        console.error(
            "React Message Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};