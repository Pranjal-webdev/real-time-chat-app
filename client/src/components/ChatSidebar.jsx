import { useEffect, useState } from "react";
import axios from "axios";
import socket from "../socket/socket";

const ChatSidebar = ({ onSelectConversation }) => {

    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState([]);
    const [searching, setSearching] = useState(false);


    const handleSearch = async (value) => {

        setSearch(value);

        if (!value.trim()) {
            setUsers([]);
            return;
        }

        try {
            setSearching(true);

            const token = localStorage.getItem("token");

            const response = await axios.get(
                `http://localhost:5001/api/users/search?search=${value}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setUsers(response.data.users || []);

        } catch (error) {
            console.error(
                "Search Users Error:",
                error.response?.data || error.message
            );
        } finally {
            setSearching(false);
        }
    };


    const handleUserClick = async (user) => {
        try {
            const token = localStorage.getItem("token");

            const response = await axios.post(
                "http://localhost:5001/api/conversations",
                {
                    userId: user._id,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const conversation = response.data.conversation;

            setConversations((prev) => {
                const exists = prev.some(
                    (item) => item._id === conversation._id
                );

                if (exists) return prev;

                return [conversation, ...prev];
            });

            onSelectConversation(conversation);

            setSearch("");
            setUsers([]);

        } catch (error) {
            console.error(
                "Create Conversation Error:",
                error.response?.data || error.message
            );
        }
    };


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

                <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                        handleSearch(e.target.value)
                    }
                    placeholder="Search users..."
                    className="w-full border rounded-lg px-3 py-2 outline-none"
                />
            </div>

            {search && (
                <div className="border-b">
                    {searching ? (
                        <p className="p-4 text-gray-500">
                            Searching...
                        </p>
                    ) : users.length === 0 ? (
                        <p className="p-4 text-gray-500">
                            No users found
                        </p>
                    ) : (
                        users.map((user) => (
                            <button
                                key={user._id}
                                onClick={() =>
                                    handleUserClick(user)
                                }
                                className="w-full text-left p-4 hover:bg-gray-100 border-b"
                            >
                                <p className="font-semibold">
                                    {user.name}
                                </p>

                                <p className="text-sm text-gray-500">
                                    {user.email}
                                </p>
                            </button>
                        ))
                    )}
                </div>
            )}

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
                    conversations.map((conversation) => {

                        const currentUserId =
                            localStorage.getItem("userId");

                        const otherUser =
                            conversation.participants?.find(
                                (user) =>
                                    user._id.toString() !==
                                    currentUserId?.toString()
                            );

                        return (
                            <button
                                key={conversation._id}
                                onClick={() => {
                                    onSelectConversation(conversation);

                                    setConversations((prev) =>
                                        prev.map((item) =>
                                            item._id === conversation._id
                                                ? {
                                                    ...item,
                                                    unreadCount: 0,
                                                }
                                                : item
                                        )
                                    );
                                }}
                                className="w-full text-left p-4 border-b hover:bg-gray-100"
                            >

                                <p className="font-semibold">
                                    {otherUser?.name || "Unknown User"}
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
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ChatSidebar;