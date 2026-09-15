import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import socket from "../socket/socket";
import MessageInput from "./MessageInput";

const ChatWindow = ({ conversation, onBack }) => {

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [replyTo, setReplyTo] = useState(null);
    const [attachmentStatus, setAttachmentStatus] = useState({});
    const [attachmentUrls, setAttachmentUrls] = useState({});
    const [pendingAttachment, setPendingAttachment] = useState(null);
    const [pendingReleaseMessage, setPendingReleaseMessage] = useState(null);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const [showScrollButton, setShowScrollButton] = useState(false);

    const currentUserId = localStorage.getItem("userId");

    const otherUser = conversation?.participants?.find(
        (user) =>
            (user._id || user).toString() !==
            currentUserId?.toString()
    );

    const otherUserId = otherUser?._id || otherUser;

    const ATTACHMENT_CACHE = "chat-attachments-v1";

    const getAttachmentCache = async () => {
        return await caches.open(ATTACHMENT_CACHE);
    };

    const createObjectUrlFromResponse = async (response) => {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    };

    const scrollToBottom = () => {
        const container = chatContainerRef.current;

        if (container) {
            container.scrollTop = container.scrollHeight;
            setShowScrollButton(false);
        }
    };

    const loadAttachment = async (message, autoLoad = false) => {
        if (!message?.fileUrl) return;

        try {
            const requestUrl =
                `http://https://real-time-chat-app-backend-1qh4.onrender.com${message.fileUrl}`;

            const cache = await getAttachmentCache();

            const cachedResponse = await cache.match(requestUrl);

            if (cachedResponse) {
                setAttachmentStatus((prev) => ({
                    ...prev,
                    [message._id]: "loading",
                }));

                const objectUrl =
                    await createObjectUrlFromResponse(cachedResponse);

                setAttachmentUrls((prev) => ({
                    ...prev,
                    [message._id]: objectUrl,
                }));

                setAttachmentStatus((prev) => ({
                    ...prev,
                    [message._id]: "loaded",
                }));

                return;
            }

            if (!autoLoad) {
                setAttachmentStatus((prev) => ({
                    ...prev,
                    [message._id]: "download",
                }));

                return;
            }

            setAttachmentStatus((prev) => ({
                ...prev,
                [message._id]: "loading",
            }));

            const response = await fetch(requestUrl);

            if (!response.ok) {
                throw new Error("Failed to load attachment");
            }

            await cache.put(
                requestUrl,
                response.clone()
            );

            const objectUrl =
                await createObjectUrlFromResponse(response);

            setAttachmentUrls((prev) => ({
                ...prev,
                [message._id]: objectUrl,
            }));

            setAttachmentStatus((prev) => ({
                ...prev,
                [message._id]: "loaded",
            }));

        } catch (error) {
            console.error(
                "Attachment Load Error:",
                error
            );

            setAttachmentStatus((prev) => ({
                ...prev,
                [message._id]: "download",
            }));
        }
    };


    useEffect(() => {
        if (!pendingReleaseMessage) return;

        if (pendingAttachment !== null) return;

        requestAnimationFrame(() => {
            socket.emit("attachmentSent", {
                conversationId: conversation._id,
                message: pendingReleaseMessage,
            });

            setPendingReleaseMessage(null);
        });
    }, [
        pendingAttachment,
        pendingReleaseMessage,
        conversation._id,
    ]);

    const handleDeleteMessage = async (messageId) => {

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this message?"
        );

        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem("token");

            await axios.delete(
                `http://https://real-time-chat-app-backend-1qh4.onrender.com/api/messages/${messageId}`,
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
                `http://https://real-time-chat-app-backend-1qh4.onrender.com/api/messages/${message._id}`,
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


    const handleReaction = async (messageId, emoji) => {
        try {
            const token = localStorage.getItem("token");

            const response = await axios.put(
                `http://https://real-time-chat-app-backend-1qh4.onrender.com/api/messages/${messageId}/reaction`,
                { emoji },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setMessages((prev) =>
                prev.map((message) =>
                    message._id === messageId
                        ? response.data.message
                        : message
                )
            );

        } catch (error) {
            console.error(
                "Reaction Error:",
                error.response?.data || error.message
            );
        }
    };


    const formatMessageDate = (date) => {
        const messageDate = new Date(date);
        const today = new Date();
        const yesterday = new Date();

        yesterday.setDate(today.getDate() - 1);

        if (
            messageDate.toDateString() ===
            today.toDateString()
        ) {
            return "Today";
        }

        if (
            messageDate.toDateString() ===
            yesterday.toDateString()
        ) {
            return "Yesterday";
        }

        return messageDate.toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "long",
                year: "numeric",
            }
        );
    };

    useEffect(() => {
        if (!loading && messages.length > 0) {
            const container = chatContainerRef.current;

            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        }
    }, [loading, conversation?._id]);

    useEffect(() => {

        if (!conversation || !otherUserId) return;

        setIsOnline(false);

        const fetchMessages = async () => {
            try {
                setLoading(true);

                const token = localStorage.getItem("token");

                const response = await axios.get(
                    `http://https://real-time-chat-app-backend-1qh4.onrender.com/api/messages/${conversation._id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const fetchedMessages = response.data.messages || [];

                setMessages(fetchedMessages);

                fetchedMessages.forEach((message) => {
                    if (
                        message.fileUrl &&
                        (message.messageType === "image" ||
                            message.messageType === "file")
                    ) {
                        loadAttachment(message, false);
                    }
                });

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

        const handleConnect = () => {
            console.log("Socket connected:", socket.id);

            socket.emit("joinConversation", {
                conversationId: conversation._id,
                userId: currentUserId,
            });

            socket.emit("markMessagesRead", {
                conversationId: conversation._id,
                userId: currentUserId,
            });

            socket.emit("checkUserOnline", otherUserId);
        };

        const handleUserOnline = ({ userId }) => {
            if (
                userId?.toString() ===
                otherUserId?.toString()
            ) {
                setIsOnline(true);
            }
        };

        const handleUserOffline = ({ userId }) => {
            if (
                userId?.toString() ===
                otherUserId?.toString()
            ) {
                setIsOnline(false);
            }
        };

        const handleUserStatus = ({ userId, isOnline }) => {
            if (
                userId?.toString() ===
                otherUserId?.toString()
            ) {
                setIsOnline(isOnline);
            }
        };

        const handleMessageReaction = (updatedMessage) => {
            setMessages((prev) =>
                prev.map((message) =>
                    message._id === updatedMessage._id
                        ? updatedMessage
                        : message
                )
            );
        };


        const handleOnlineUsers = ({ userIds }) => {
            const online = userIds?.some(
                (id) =>
                    id?.toString() ===
                    otherUserId?.toString()
            );

            setIsOnline(online);
        };

        const handleNewMessage = (message) => {
            console.log("LIVE NEW MESSAGE:", message);

            const messageConversationId =
                message.conversation?._id ||
                message.conversation;

            if (
                messageConversationId?.toString() !==
                conversation._id.toString()
            ) {
                return;
            }

            const senderId =
                message.sender?._id ||
                message.sender;


            if (
                senderId?.toString() ===
                currentUserId?.toString()
            ) {
                return;
            }


            if (
                message.fileUrl &&
                (message.messageType === "image" ||
                    message.messageType === "file")
            ) {

                setAttachmentStatus((prev) => ({
                    ...prev,
                    [message._id]: "loading",
                }));

                const container = chatContainerRef.current;

                if (
                    container &&
                    container.scrollHeight -
                    container.scrollTop -
                    container.clientHeight >=
                    50
                ) {
                    setShowScrollButton(true);
                }

                setMessages((prev) => {
                    if (prev.some((msg) => msg._id === message._id)) {
                        return prev;
                    }

                    return [...prev, message];
                });


                
                loadAttachment(message, true);
                
                return;
            }

            const container = chatContainerRef.current;

            if (
                container &&
                container.scrollHeight -
                container.scrollTop -
                container.clientHeight >=
                50
            ) {
                setShowScrollButton(true);
            }

            setMessages((prev) => {
                if (prev.some((msg) => msg._id === message._id)) {
                    return prev;
                }

                return [...prev, message];
            });
        };
        const handleMessageDeleted = ({ messageId }) => {
            setMessages((prev) =>
                prev.filter(
                    (message) =>
                        message._id !== messageId
                )
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

        const handleMessagesRead = ({ conversationId }) => {
            if (
                conversationId?.toString() !==
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

        const handleTyping = () => {
            setIsTyping(true);
        };

        const handleStopTyping = () => {
            setIsTyping(false);
        };


        socket.on("userOnline", handleUserOnline);
        socket.on("userOffline", handleUserOffline);
        socket.on("onlineUsers", handleOnlineUsers);
        socket.on("userStatus", handleUserStatus);


        if (socket.connected) {
            handleConnect();
        }

        socket.on("newMessage", handleNewMessage);
        socket.on("messageDeleted", handleMessageDeleted);
        socket.on("messageEdited", handleMessageEdited);
        socket.on("messageReaction", handleMessageReaction);
        socket.on("messagesRead", handleMessagesRead);

        socket.on("typing", handleTyping);
        socket.on("stopTyping", handleStopTyping);



        return () => {

            socket.off("userOnline", handleUserOnline);
            socket.off("userOffline", handleUserOffline);
            socket.off("onlineUsers", handleOnlineUsers);
            socket.off("userStatus", handleUserStatus);

            socket.off("newMessage", handleNewMessage);
            socket.off("messageDeleted", handleMessageDeleted);
            socket.off("messageEdited", handleMessageEdited);
            socket.off("messageReaction", handleMessageReaction);
            socket.off("messagesRead", handleMessagesRead);

            socket.off("typing", handleTyping);
            socket.off("stopTyping", handleStopTyping);
        };

    }, [conversation, otherUserId]);


    if (!conversation) {

        return (

            <div className="flex-1 flex items-center justify-center bg-gray-50">

                <div className="text-center px-6">

                    <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-blue-100 flex items-center justify-center text-4xl shadow-sm">
                        💬
                    </div>

                    <h1 className="text-3xl font-bold text-gray-800">
                        Welcome to ChatApp
                    </h1>

                    <p className="text-gray-500 mt-3">
                        Select a conversation and start messaging
                    </p>

                </div>

            </div>
        );
    }


    return (

        <div className="relative flex-1 flex flex-col h-full min-w-0 bg-white">

            <div className="flex items-center gap-3">

                <button
                    type="button"
                    onClick={onBack}
                    className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-2xl text-gray-600 shrink-0"
                >
                    ❮
                </button>

                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                    {otherUser?.name
                        ?.charAt(0)
                        .toUpperCase() || "U"}
                </div>

                <h2 className="font-semibold text-lg">
                    {otherUser?.name || "Chat"}
                </h2>

                <p className="text-sm text-gray-500">
                    {isOnline ? "🟢 Online" : "⚫ Offline"}
                </p>

            </div>

            <div
                ref={chatContainerRef}
                onScroll={() => {
                    const container = chatContainerRef.current;

                    if (!container) return;

                    const isAtBottom =
                        container.scrollHeight -
                        container.scrollTop -
                        container.clientHeight <
                        50;

                    setShowScrollButton(!isAtBottom);
                }}
                className="flex-1 px-6 py-5 overflow-y-auto bg-slate-50"
            >

                {loading ? (
                    <div className="flex-1 flex items-center justify-center bg-slate-50">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                            <p className="text-sm text-gray-500">
                                Loading messages...
                            </p>
                        </div>
                    </div>
                ) : messages.length === 0 ? (
                    <p className="text-gray-500 text-center mt-10">
                        No messages yet
                    </p>
                ) : (
                    <div className="space-y-3">

                        {messages.map((message, index) => {
                            const previousMessage = messages[index - 1];

                            const showDateSeparator =
                                !previousMessage ||
                                new Date(previousMessage.createdAt).toDateString() !==
                                new Date(message.createdAt).toDateString();

                            const senderId =
                                message.sender?._id || message.sender;

                            const isMine =
                                senderId?.toString() ===
                                currentUserId?.toString();

                            return (
                                <React.Fragment key={message._id}>

                                    {showDateSeparator && (
                                        <div className="flex justify-center my-4">
                                            <span className="bg-gray-300 text-gray-700 text-xs px-3 py-1 rounded-full">
                                                {formatMessageDate(message.createdAt)}
                                            </span>
                                        </div>
                                    )}

                                    <div
                                        className={`flex ${isMine
                                            ? "justify-end"
                                            : "justify-start"
                                            }`}
                                    >
                                        <div
                                            className={`max-w-md px-4 py-3 rounded-2xl ${isMine
                                                ? "bg-blue-600 text-white rounded-bl-none"
                                                : "bg-white text-gray-800 rounded-rl-none shadow-sm"
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
                                                    <>
                                                        {attachmentStatus[message._id] === "loading" ? (
                                                            <div className="w-48 max-w-full h-48 bg-gray-100 rounded-lg flex flex-col items-center justify-center">
                                                                <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />

                                                                <p className="text-xs text-gray-500 mt-2">
                                                                    Loading image...
                                                                </p>
                                                            </div>
                                                        ) : attachmentStatus[message._id] === "loaded" ? (
                                                            <img
                                                                src={attachmentUrls[message._id]}
                                                                alt={message.fileName || "Image"}
                                                                className="w-48 h-48 object-contain rounded-lg"
                                                            />
                                                        ) : isMine ? (
                                                            <img
                                                                src={`http://https://real-time-chat-app-backend-1qh4.onrender.com${message.fileUrl}`}
                                                                alt={message.fileName || "Image"}
                                                                className="w-48 h-48 object-contain rounded-lg"
                                                            />
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    loadAttachment(message, true)
                                                                }
                                                                className="w-48 max-w-full h-48 bg-gray-100 rounded-lg flex flex-col items-center justify-center hover:bg-gray-200 transition"
                                                            >
                                                                <span className="text-4xl">
                                                                    ⬇️
                                                                </span>

                                                                <span className="text-sm font-medium mt-2">
                                                                    Download image
                                                                </span>

                                                                <span className="text-xs text-gray-500 mt-1 max-w-[170px] truncate">
                                                                    {message.fileName}
                                                                </span>
                                                            </button>
                                                        )}
                                                    </>
                                                )}


                                            {message.messageType === "file" &&
                                                message.fileUrl && (
                                                    <>
                                                        {attachmentStatus[message._id] === "loading" ? (
                                                            <div className="flex items-center gap-3 max-w-full ">
                                                                <div className="w-6 h-6 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />

                                                                <span>
                                                                    Loading file...
                                                                </span>
                                                            </div>
                                                        ) : attachmentStatus[message._id] === "loaded" ? (
                                                            <a
                                                                href={attachmentUrls[message._id]}
                                                                download={message.fileName}
                                                                className="flex items-center gap-3 w-fit max-w-[220px] underline"
                                                            >
                                                                <span className="truncate max-w-[180px]">
                                                                    📎 {message.fileName}
                                                                </span>
                                                            </a>
                                                        ) : isMine ? (
                                                            <a
                                                                href={`http://https://real-time-chat-app-backend-1qh4.onrender.com${message.fileUrl}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-3 w-fit max-w-[220px] underline"
                                                            >
                                                                <span className="truncate max-w-[180px]">
                                                                    📎 {message.fileName}
                                                                </span>
                                                            </a>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    loadAttachment(message, true)
                                                                }
                                                                className="flex items-center gap-3 max-w-full"
                                                            >
                                                                <span className="text-2xl">
                                                                    ⬇️
                                                                </span>

                                                                <div className="text-left">
                                                                    <p className="font-medium">
                                                                        Download file
                                                                    </p>

                                                                    <p className="text-xs opacity-70 max-w-[180px] truncate">
                                                                        {message.fileName}
                                                                    </p>
                                                                </div>
                                                            </button>
                                                        )}
                                                    </>
                                                )}


                                            {message.messageType === "text" && (
                                                <p>{message.text}</p>
                                            )}


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
                                                    onClick={() =>
                                                        handleDeleteMessage(message._id)
                                                    }
                                                    className="text-xs px-2 py-1 cursor-pointer text-xl"
                                                >
                                                    Delete
                                                </button>
                                            )}


                                            {isMine && (
                                                <button
                                                    onClick={() =>
                                                        handleEditMessage(message)
                                                    }
                                                    className="text-xs px-2 py-1 cursor-pointer text-xl"
                                                >
                                                    Edit
                                                </button>
                                            )}


                                            <button
                                                onClick={() => setReplyTo(message)}
                                                className="text-xs px-2 py-1 cursor-pointer text-xl"
                                            >
                                                Reply
                                            </button>


                                            {isMine && message.read && (
                                                <p className="text-xs text-blue-200">
                                                    ✓✓ Seen
                                                </p>
                                            )}


                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    onClick={() =>
                                                        handleReaction(message._id, "❤️")
                                                    }
                                                    className="text-sm"
                                                >
                                                    ❤️
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        handleReaction(message._id, "👍")
                                                    }
                                                    className="text-sm"
                                                >
                                                    👍
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        handleReaction(message._id, "😂")
                                                    }
                                                    className="text-sm"
                                                >
                                                    😂
                                                </button>
                                            </div>

                                            {message.reactions?.length > 0 && (
                                                <div className="flex gap-1 mt-2">
                                                    {message.reactions.map(
                                                        (reaction, index) => (
                                                            <span
                                                                key={index}
                                                                className="bg-gray-200 rounded-full px-2 py-1 text-xs"
                                                            >
                                                                {reaction.emoji}
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            )}

                                        </div>
                                    </div>

                                </React.Fragment>
                            );
                        })}

                        {pendingAttachment && (
                            <div className="flex justify-end mb-3">
                                <div className="bg-blue-600 text-white rounded-2xl px-4 py-3">

                                    {pendingAttachment.preview ? (
                                        <div className="relative w-48 h-48 rounded-lg overflow-hidden">

                                            <img
                                                src={pendingAttachment.preview}
                                                alt="Sending"
                                                className="w-full h-full object-cover opacity-60"
                                            />

                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">

                                                <div className="w-10 h-10 border-4 border-white/40 border-t-white rounded-full animate-spin" />

                                                <p className="text-sm font-medium mt-3">
                                                    Sending image...
                                                </p>

                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 min-w-[220px]">

                                            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-xl">
                                                📎
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {pendingAttachment.name}
                                                </p>

                                                <p className="text-xs opacity-80">
                                                    Sending file...
                                                </p>
                                            </div>

                                            <div className="w-6 h-6 border-3 border-white/40 border-t-white rounded-full animate-spin" />

                                        </div>
                                    )}

                                </div>
                            </div>
                        )}

                    </div>
                )}

                <div ref={messagesEndRef} />

            </div>

            {showScrollButton && (
                <button
                    type="button"
                    onClick={scrollToBottom}
                    className="absolute bottom-24 right-5 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-xl hover:bg-gray-50 transition"
                >
                    ↓
                </button>
            )}

            {isTyping && (
                <p className="text-sm text-gray-500 px-5 pb-2">
                    User is typing...
                </p>
            )}

            <MessageInput
                conversationId={conversation._id}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}

                onImageUploadStart={(file) => {
                    setPendingAttachment({
                        name: file.name,
                        type: file.type,
                        preview: file.type.startsWith("image/")
                            ? URL.createObjectURL(file)
                            : null,
                    });
                }}

                onMessageSent={(message) => {
                    setAttachmentStatus((prev) => ({
                        ...prev,
                        [message._id]: "loading",
                    }));

                    setMessages((prev) => [...prev, message]);

                    requestAnimationFrame(() => {
                        scrollToBottom();
                    });

                    if (pendingAttachment?.preview) {
                        URL.revokeObjectURL(pendingAttachment.preview);
                    }

                    setPendingReleaseMessage(message);
                    setPendingAttachment(null);
                    setReplyTo(null);

                    requestAnimationFrame(() => {
                        setAttachmentStatus((prev) => ({
                            ...prev,
                            [message._id]: "loaded",
                        }));
                    })
                }}
            />

        </div>
    )
};

export default ChatWindow;