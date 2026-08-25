import { useEffect, useState } from "react";
import axios from "axios";
import socket from "../socket/socket";

const ChatSidebar = ({ onSelectConversation }) => {

    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const fetchConversations = async () => {

            try {
                const token = localStorage.getItem("token");

                const response = await axios.get(
                    "http://localhost:5001/api/conversations",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                setConversations(
                    response.data.conversations || []
                );

            } catch (error) {
                console.error(
                    "Fetch Conversations Error:",
                    error.response?.data || error.message
                );
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();

        const handleNewMessage = (message) => {

            const conversationId =
                message.conversation?._id ||
                message.conversation;

            const currentUserId =
                localStorage.getItem("userId");

            const senderId =
                message.sender?._id ||
                message.sender;

            setConversations((prev) =>
                prev.map((conversation) => {
                    
                    if (
                        conversation._id.toString() ===
                        conversationId.toString()
                    ) {
                        return {
                            ...conversation,
                            lastMessage: message,
                            unreadCount:
                                senderId?.toString() !==
                                    currentUserId?.toString()
                                    ? (conversation.unreadCount || 0) + 1
                                    : conversation.unreadCount,
                        };
                    }

                    return conversation;
                })
            );
        };

        socket.on("newMessage", handleNewMessage);

        return () => {
            socket.off("newMessage", handleNewMessage);
        };
    }, []);


    return (
        <div className="w-80 bg-white border-r border-gray-200 h-full">

            <div className="p-5 border-b">
                <h2 className="text-xl font-bold">
                    Chats
                </h2>
            </div>

            <div>
                {loading ? (
                    <p className="p-4 text-gray-500">
                        Loading chats...
                    </p>
                ) : conversations.length === 0 ? (
                    <p className="p-4 text-gray-500">
                        No conversations yet
                    </p>
                ) : (
                    conversations.map((conversation) => (
                        <button
                            key={conversation._id}
                            onClick={() => {
                                onSelectConversation(conversation)
                                setConversations((prev) =>
                                    prev.map((item) =>
                                        item._id === conversation._id
                                            ? { ...item, unreadCount: 0 }
                                            : item
                                    )
                                );
                            }}
                            className="w-full text-left p-4 border-b hover:bg-gray-100"
                        >
                            <p className="font-semibold">
                                Chat
                            </p>

                            <div className="flex justify-between items-center">
                                <p className="text-sm text-gray-500">
                                    {conversation.lastMessage?.text ||
                                        "No messages yet"}
                                </p>

                                {conversation.unreadCount > 0 && (
                                    <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                                        {conversation.unreadCount}
                                    </span>
                                )}

                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};

export default ChatSidebar;