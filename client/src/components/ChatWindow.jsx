import { useEffect, useState } from "react";
import axios from "axios";
import socket from "../socket/socket";
import MessageInput from "./MessageInput";

const ChatWindow = ({ conversation }) => {

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [replyTo, setReplyTo] = useState(null);

    const currentUserId = localStorage.getItem("userId");

    const otherUser = conversation?.participants?.find(
        (user) =>
            (user._id || user).toString() !==
            currentUserId?.toString()
    );

    const otherUserId = otherUser?._id || otherUser;

    const handleDeleteMessage = async (messageId) => {

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this message?"
        );

        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem("token");

            await axios.delete(
                `http://localhost:5001/api/messages/${messageId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setMessages((prev) =>
                prev.filter((message) => message._id !== messageId)
            );

            socket.emit("deleteMessage", {
                conversationId: conversation._id,
                messageId,
            });

        } catch (error) {
            console.error(
                "Delete Message Error:",
                error.response?.data || error.message
            );
        }
    };


    const handleEditMessage = async (message) => {
        const newText = prompt("Edit message:", message.text);

        if (!newText || !newText.trim()) return;

        try {
            const token = localStorage.getItem("token");

            const response = await axios.put(
                `http://localhost:5001/api/messages/${message._id}`,
                {
                    text: newText.trim(),
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const updatedMessage = response.data.updatedMessage;

            setMessages((prev) =>
                prev.map((item) =>
                    item._id === message._id
                        ? updatedMessage
                        : item
                )
            );

            socket.emit("editMessage", {
                conversationId: conversation._id,
                message: updatedMessage,
            });

        } catch (error) {
            console.error(
                "Edit Message Error:",
                error.response?.data || error.message
            );
        }
    };


    useEffect(() => {

        if (!conversation) return;

        const fetchMessages = async () => {

            try {
                setLoading(true);

                const token = localStorage.getItem("token");

                const response = await axios.get(
                    `http://localhost:5001/api/messages/${conversation._id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                setMessages(response.data.messages || []);

            } catch (error) {

                console.error(
                    "Fetch Messages Error:",
                    error.response?.data || error.message
                );

            } finally {
                setLoading(false);
            }
        };

        fetchMessages();

        if (!socket.connected) {

            socket.connect();
        }

        const handleConnect = () => {

            console.log("Socket connected:", socket.id);

            socket.emit("joinConversation", conversation._id);

            socket.emit("markMessagesRead", {
                conversationId: conversation._id,
                userId: currentUserId,
            });
        };

        const handleNewMessage = (message) => {

            console.log("New message received:", message);

            const messageConversationId =
                message.conversation?._id ||
                message.conversation;

            if (
                messageConversationId?.toString() ===
                conversation._id.toString()
            ) {
                const senderId = message.sender?._id || message.sender;

                if (
                    senderId?.toString() ===
                    currentUserId?.toString()
                ) {
                    return;
                }

                setMessages((prev) => [
                    ...prev,
                    message,
                ]);
            }
        };

        const handleMessageDeleted = ({ messageId }) => {
            setMessages((prev) =>
                prev.filter((message) => message._id !== messageId)
            );
        };

        const handleMessageEdited = (updatedMessage) => {
            setMessages((prev) =>
                prev.map((message) =>
                    message._id === updatedMessage._id
                        ? updatedMessage
                        : message
                )
            );
        };

        socket.on("connect", handleConnect);
        socket.on("newMessage", handleNewMessage);
        socket.on("messageDeleted", handleMessageDeleted);
        socket.on("messageEdited", handleMessageEdited);

        const handleTyping = () => {
            setIsTyping(true);
        };

        const handleUserOnline = () => {
            if (
                userId?.toString() ===
                otherUserId?.toString()
            ) {
                setIsOnline(true);
            }
        };

        const handleUserOffline = () => {
            if (
                userId?.toString() ===
                otherUserId?.toString()
            ) {
                setIsOnline(false);
            }
        };

        const handleMessagesRead = ({ conversationId }) => {
            if (
                conversationId.toString() !==
                conversation._id.toString()
            ) {
                return;
            }

            setMessages((prev) =>
                prev.map((message) => ({
                    ...message,
                    read: true,
                    isRead: true,
                }))
            );
        };

        socket.on("userOnline", handleUserOnline);
        socket.on("userOffline", handleUserOffline);
        socket.on("messagesRead", handleMessagesRead);

        const handleStopTyping = () => {
            setIsTyping(false);
        };

        socket.on("typing", handleTyping);
        socket.on("stopTyping", handleStopTyping);


        if (socket.connected) {

            socket.emit("joinConversation", conversation._id);

            socket.emit("markMessagesRead", {
                conversationId: conversation._id,
                userId: currentUserId,
            });
        }

        return () => {

            socket.off("connect", handleConnect);
            socket.off("newMessage", handleNewMessage);
            socket.off("typing", handleTyping);
            socket.off("stopTyping", handleStopTyping);
            socket.off("userOnline", handleUserOnline);
            socket.off("userOffline", handleUserOffline);
            socket.off("messagesRead", handleMessagesRead);
            socket.off("messageDeleted", handleMessageDeleted);
            socket.off("messageEdited", handleMessageEdited);
        };
    }, [conversation, otherUserId]);


    if (!conversation) {

        return (
            <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a conversation to start messaging
            </div>
        );
    }


    return (

        <div className="flex-1 flex flex-col bg-gray-100">

            <div className="bg-white border-b p-5">

                <h2 className="font-semibold text-lg">
                    {otherUser?.name || "Chat"}
                </h2>

                <p className="text-sm text-gray-500">
                    {isOnline ? "🟢 Online" : "⚫ Offline"}
                </p>

            </div>

            <div className="flex-1 p-5 overflow-y-auto">

                {loading ? (
                    <p className="text-gray-500 text-center">
                        Loading messages...
                    </p>
                ) : messages.length === 0 ? (
                    <p className="text-gray-500 text-center mt-10">
                        No messages yet
                    </p>
                ) : (
                    <div className="space-y-3">

                        {messages.map((message) => {
                            const senderId =
                                message.sender?._id ||
                                message.sender;

                            const isMine =
                                senderId?.toString() ===
                                currentUserId?.toString();

                            return (
                                <div
                                    key={message._id}
                                    className={`flex ${isMine
                                        ? "justify-end"
                                        : "justify-start"
                                        }`}
                                >
                                    <div
                                        className={`max-w-md px-4 py-3 rounded-2xl ${isMine
                                            ? "bg-blue-600 text-white rounded-br-none"
                                            : "bg-white text-gray-800 rounded-bl-none shadow-sm"
                                            }`}
                                    >
                                        {message.replyTo && (
                                            <div className="mb-2 p-2 rounded bg-black/10 border-l-2 border-gray-400">
                                                <p className="text-xs font-semibold">
                                                    {message.replyTo.sender?.name || "User"}
                                                </p>

                                                <p className="text-xs opacity-70 truncate">
                                                    {message.replyTo.text}
                                                </p>
                                            </div>
                                        )}

                                        {message.messageType === "image" &&
                                            message.fileUrl && (
                                                <img
                                                    src={`http://localhost:5001${message.fileUrl}`}
                                                    alt={message.fileName || "Image"}
                                                    className="max-w-xs rounded-lg"
                                                />
                                            )}

                                        {message.messageType === "file" &&
                                            message.fileUrl && (
                                                <a
                                                    href={`http://localhost:5001${message.fileUrl}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="underline"
                                                >
                                                    📎 {message.fileName}
                                                </a>
                                            )}

                                        {message.messageType === "text" && (
                                            <p>{message.text}</p>
                                        )}
                                        <p>
                                            {message.text}
                                        </p>

                                        {message.isEdited && (
                                            <span className="text-xs opacity-70">
                                                edited
                                            </span>
                                        )}

                                        <p
                                            className={`text-xs mt-1 ${isMine
                                                ? "text-blue-100"
                                                : "text-gray-400"
                                                }`}
                                        >
                                            {new Date(
                                                message.createdAt
                                            ).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>

                                        {isMine && (
                                            <button
                                                onClick={() => handleDeleteMessage(message._id)}
                                                className="text-xs mt-2 underline"
                                            >
                                                Delete
                                            </button>
                                        )}

                                        {isMine && (
                                            <button
                                                onClick={() => handleEditMessage(message)}
                                                className="text-xs mt-2 underline"
                                            >
                                                Edit
                                            </button>
                                        )}

                                        <button
                                            onClick={() => setReplyTo(message)}
                                            className="text-xs mt-2 underline ml-2"
                                        >
                                            Reply
                                        </button>

                                        {isMine && message.read && (
                                            <p className="text-xs text-blue-200">
                                                ✓✓ Seen
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                    </div>
                )}

            </div>

            {isTyping && (
                <p className="text-sm text-gray-500 px-5 pb-2">
                    User is typing...
                </p>
            )}

            <MessageInput
                conversationId={conversation._id}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                onMessageSent={(message) => {
                    setMessages((prev) => [
                        ...prev,
                        message,
                    ]);
                    setReplyTo(null);
                }}
            />

        </div>
    )
};

export default ChatWindow;