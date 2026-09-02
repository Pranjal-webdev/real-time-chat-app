import { Server } from "socket.io";

let io;

const onlineUsers = new Map();

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [
            "http://localhost:5173",
            "http://localhost:5174"
        ],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on("joinConversation", (conversationId) => {
            socket.join(`conversation:${conversationId}`);

            socket.to(`conversation:${conversationId}`).emit("userOnline");

            console.log(
                `${socket.id} joined conversation:${conversationId}`
            );
        });

        socket.on("markMessagesRead", ({ conversationId, userId }) => {
            socket
                .to(`conversation:${conversationId}`)
                .emit("messagesRead", {
                    conversationId,
                    userId,
                });
        });

        socket.on("deleteMessage", ({ conversationId, messageId }) => {
            io.to(`conversation:${conversationId}`).emit(
                "messageDeleted",
                { messageId }
            );
        });

        socket.on("editMessage", ({ conversationId, message }) => {
            io.to(`conversation:${conversationId}`).emit(
                "messageEdited",
                message
            );
        });

        socket.on("deleteMessage", ({ conversationId, messageId }) => {
            io.to(`conversation:${conversationId}`).emit(
                "messageDeleted",
                { messageId }
            );
        });

        socket.on("typing", (conversationId) => {
            socket
                .to(`conversation:${conversationId}`)
                .emit("typing");
        });

        socket.on("stopTyping", (conversationId) => {
            socket
                .to(`conversation:${conversationId}`)
                .emit("stopTyping");
        });

        socket.on("userOnline", (userId) => {
            onlineUsers.set(userId.toString(), socket.id);

            socket.join(userId.toString());

            socket.broadcast.emit("userOnline", {
                userId,
            });
        });

        socket.on("disconnect", () => {
            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    onlineUsers.delete(userId);

                    socket.broadcast.emit("userOffline", {
                        userId,
                    });

                    break;
                }
            }
        });

        return io;
    });
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO has not been initialized");
    }

    return io;
};