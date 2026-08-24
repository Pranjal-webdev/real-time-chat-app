import { Server } from "socket.io";

let io;

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL,
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

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
            socket.broadcast.emit("userOffline");
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO has not been initialized");
    }

    return io;
};