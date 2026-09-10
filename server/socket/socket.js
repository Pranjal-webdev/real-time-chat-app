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

        socket.on("joinConversation", ({ conversationId, userId }) => {

            socket.join(`conversation:${conversationId}`);

            onlineUsers.set(
                userId.toString(),
                socket.id
            );

            socket.join(userId.toString());

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
        });

        socket.on("markMessagesRead", ({ conversationId, userId }) => {
            socket
                .to(`conversation:${conversationId}`)
                .emit("messagesRead", {
                    conversationId,
                    userId,
                });
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

            const userIdString = userId.toString();

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

        return io;
    });
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO has not been initialized");
    }

    return io;
};