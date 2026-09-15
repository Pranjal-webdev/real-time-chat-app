import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";

let io;

const onlineUsers = new Map();

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [
                "http://localhost:5173",
                "http://localhost:5174",
                "https://real-time-chat-app-two-wine.vercel.app",
            ],
            credentials: true,
        },
    });

    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token;

            if (!token) {
                return next(new Error("Authentication required"));
            }

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            socket.userId = decoded.userId;

            next();

        } catch (error) {
            console.error("Socket Auth Error:", error.message);
            next(new Error("Invalid or expired token"));
        }
    });

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on("joinConversation", async ({ conversationId }) => {

            try {
                if (!mongoose.Types.ObjectId.isValid(conversationId)) {
                    return socket.emit("socketError", {
                        message: "Invalid conversation ID",
                    });
                }

                const conversation = await Conversation.findById(
                    conversationId
                ).select("participants");

                if (!conversation) {
                    return socket.emit("socketError", {
                        message: "Conversation not found",
                    });
                }

                const isParticipant = conversation.participants.some(
                    (participant) =>
                        participant.toString() ===
                        socket.userId.toString()
                );

                if (!isParticipant) {
                    return socket.emit("socketError", {
                        message: "You are not a participant of this conversation",
                    });
                }

                const userId = socket.userId.toString();

                socket.join(`conversation:${conversationId}`);

                onlineUsers.set(userId, socket.id);

                socket.join(userId);

                socket.emit("onlineUsers", {
                    userIds: [...onlineUsers.keys()],
                });

                socket.to(
                    `conversation:${conversationId}`
                ).emit("userOnline", {
                    userId,
                });

                console.log(
                    `${socket.id} joined conversation:${conversationId}`
                );

            } catch (error) {
                console.error(
                    "Join Conversation Error:",
                    error.message
                );

                socket.emit("socketError", {
                    message: "Unable to join conversation",
                });
            }
        });

        socket.on("markMessagesRead", async ({ conversationId }) => {
            try {
                if (!mongoose.Types.ObjectId.isValid(conversationId)) return;

                const conversation = await Conversation.findById(conversationId)
                    .select("participants");

                if (!conversation) return;

                const isParticipant = conversation.participants.some(
                    (participant) =>
                        participant.toString() === socket.userId.toString()
                );

                if (!isParticipant) return;

                socket.to(`conversation:${conversationId}`).emit(
                    "messagesRead",
                    {
                        conversationId,
                        userId: socket.userId,
                    }
                );
            } catch (error) {
                console.error("Mark Read Socket Error:", error.message);
            }
        });

        socket.on("editMessage", async ({ conversationId, message }) => {
            try {
                if (!mongoose.Types.ObjectId.isValid(conversationId)) return;

                const conversation = await Conversation.findById(conversationId)
                    .select("participants");

                if (!conversation) return;

                const isParticipant = conversation.participants.some(
                    (participant) =>
                        participant.toString() === socket.userId.toString()
                );

                if (!isParticipant) return;

                io.to(`conversation:${conversationId}`).emit(
                    "messageEdited",
                    message
                );

            } catch (error) {
                console.error("Edit Message Socket Error:", error.message);
            }
        });

        socket.on("deleteMessage", async ({ conversationId, messageId }) => {
            try {
                if (!mongoose.Types.ObjectId.isValid(conversationId)) return;

                const conversation = await Conversation.findById(conversationId)
                    .select("participants");

                if (!conversation) return;

                const isParticipant = conversation.participants.some(
                    (participant) =>
                        participant.toString() === socket.userId.toString()
                );

                if (!isParticipant) return;

                io.to(`conversation:${conversationId}`).emit(
                    "messageDeleted",
                    { messageId }
                );

            } catch (error) {
                console.error("Delete Message Socket Error:", error.message);
            }
        });

        socket.on("typing", async (conversationId) => {
            try {
                if (!mongoose.Types.ObjectId.isValid(conversationId)) return;

                const conversation = await Conversation.findById(conversationId)
                    .select("participants");

                if (!conversation) return;

                const isParticipant = conversation.participants.some(
                    (participant) =>
                        participant.toString() === socket.userId.toString()
                );

                if (!isParticipant) return;

                socket.to(`conversation:${conversationId}`).emit("typing");
            } catch (error) {
                console.error("Typing Socket Error:", error.message);
            }
        });

        socket.on("stopTyping", async (conversationId) => {
            try {
                if (!mongoose.Types.ObjectId.isValid(conversationId)) return;

                const conversation = await Conversation.findById(conversationId)
                    .select("participants");

                if (!conversation) return;

                const isParticipant = conversation.participants.some(
                    (participant) =>
                        participant.toString() === socket.userId.toString()
                );

                if (!isParticipant) return;

                socket.to(`conversation:${conversationId}`).emit("stopTyping");
            } catch (error) {
                console.error("Stop Typing Socket Error:", error.message);
            }
        });

        socket.on("userOnline", (userId) => {

            const userIdString = socket.userId.toString();

            onlineUsers.set(userIdString, socket.id);

            socket.join(userIdString);

            socket.emit("onlineUsers", {
                userIds: [...onlineUsers.keys()],
            });

            socket.broadcast.emit("userOnline", {
                userId: userIdString,
            });

            console.log("ONLINE USER:", userIdString);
        });

        socket.on("checkUserOnline", (userId) => {

            if (!userId) {
                return;
            }

            const userIdString = userId.toString();
            const isOnline = onlineUsers.has(userIdString);

            console.log(
                "CHECK USER:",
                userIdString,
                "ONLINE:",
                isOnline
            );

            socket.emit("userStatus", {
                userId: userIdString,
                isOnline,
            });
        });

        socket.on("attachmentSent", async ({ conversationId, message }) => {
            try {
                if (!mongoose.Types.ObjectId.isValid(conversationId)) return;

                const conversation = await Conversation.findById(conversationId)
                    .select("participants");

                if (!conversation) return;

                const isParticipant = conversation.participants.some(
                    (participant) =>
                        participant.toString() === socket.userId.toString()
                );

                if (!isParticipant) return;

                console.log("ATTACHMENT RELEASED:", message?._id);

                io.to(`conversation:${conversationId}`).emit(
                    "newMessage",
                    message
                );
            } catch (error) {
                console.error("Attachment Socket Error:", error.message);
            }
        });

        socket.on("disconnect", () => {
            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    onlineUsers.delete(userId);

                    socket.broadcast.emit("userOffline", {
                        userId,
                    });

                    console.log("OFFLINE USER:", userId);

                    break;
                }
            }
        });
    });
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO has not been initialized");
    }

    return io;
};