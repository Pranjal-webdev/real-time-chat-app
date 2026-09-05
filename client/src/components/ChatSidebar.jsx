import { useEffect, useState } from "react";
import axios from "axios";
import socket from "../socket/socket";
import FriendRequests from "./FriendRequests";

const ChatSidebar = ({ onSelectConversation, onConversationCreated }) => {

    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState([]);
    const [searching, setSearching] = useState(false);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [followedUsers, setFollowedUsers] = useState([]);

    const fetchSentRequests = async () => {

        try {
            const token = localStorage.getItem("token");

            const response = await axios.get(
                "http://localhost:5001/api/friend-requests/sent",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const requests = response.data.requests || [];


            const pendingIds = requests
                .filter(
                    (request) =>
                        request.status === "pending"
                )
                .map(
                    (request) =>
                        request.receiver?._id ||
                        request.receiver
                );


            const acceptedIds = requests
                .filter(
                    (request) =>
                        request.status === "accepted"
                )
                .map(
                    (request) =>
                        request.receiver?._id ||
                        request.receiver
                );

            setPendingRequests(pendingIds);
            setFollowedUsers(acceptedIds);


        } catch (error) {
            console.error(
                "Fetch Sent Requests Error:",
                error.response?.data || error.message
            );
        }
    };



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


    const handleSendRequest = async (userId) => {

        console.log("USER ID:", userId);

        try {
            const token = localStorage.getItem("token");

            await axios.post(
                "http://localhost:5001/api/friend-requests",

                { userId: userId },

                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setPendingRequests((prev) => [
                ...prev,
                userId,
            ]);

        } catch (error) {
            console.error(
                "Send Request Error:",
                error.response?.data || error.message
            );

            const message = error.response?.data?.message;

            if (message?.includes("already pending")) {
                setPendingRequests((prev) =>
                    prev.includes(userId)
                        ? prev
                        : [...prev, userId]
                );
                return;
            }

            alert(message || "Failed to send request");
        }
    };

    const handleFollowedUserClick = async (user) => {

        const currentUserId = localStorage.getItem("userId");

        console.log("CLICKED USER:", user._id, user.name);
        console.log("CURRENT USER:", currentUserId);

        let conversation = conversations.find((conversation) => {
            const participants = conversation.participants || [];

            const hasCurrentUser = participants.some((participant) => {
                const participantId = participant?._id || participant;

                return (
                    participantId?.toString() ===
                    currentUserId?.toString()
                );
            });

            const hasClickedUser = participants.some((participant) => {
                const participantId = participant?._id || participant;

                return (
                    participantId?.toString() ===
                    user._id?.toString()
                );
            });

            return hasCurrentUser && hasClickedUser;
        });

        console.log("FOUND CONVERSATION:", conversation);


        if (!conversation) {
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

                conversation = response.data.conversation;

                console.log(
                    "NEW CONVERSATION CREATED:",
                    conversation
                );

                // Add only if it doesn't already exist
                setConversations((prev) => {
                    const exists = prev.some(
                        (item) =>
                            item._id?.toString() ===
                            conversation._id?.toString()
                    );

                    if (exists) {
                        return prev;
                    }

                    return [conversation, ...prev];
                });

            } catch (error) {
                console.error(
                    "Create Conversation Error:",
                    error.response?.data || error.message
                );

                return;
            }
        }

        console.log(
            "OPENING CONVERSATION:",
            conversation
        );

        onSelectConversation(conversation);

        setSearch("");
        setUsers([]);
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
        fetchSentRequests();

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

        const handleFriendRequestAccepted = (conversation) => {

            setConversations((prev) => {

                const alreadyExists = prev.some(
                    (item) => item._id === conversation._id
                );

                if (alreadyExists) {
                    return prev;
                }

                return [
                    conversation,
                    ...prev,
                ];
            });


            const currentUserId = localStorage.getItem("userId");

            const otherUser = conversation.participants?.find(
                (user) =>
                    user._id.toString() !==
                    currentUserId?.toString()
            );

            if (!otherUser) return;

            setPendingRequests((prev) =>
                prev.filter(
                    (id) =>
                        id.toString() !==
                        otherUser._id.toString()
                )
            );

            setFollowedUsers((prev) =>
                prev.includes(otherUser._id)
                    ? prev
                    : [...prev, otherUser._id]
            );
        };

        socket.on("friendRequestAccepted", handleFriendRequestAccepted);
        socket.on("newMessage", handleNewMessage);

        return () => {

            socket.off("friendRequestAccepted", handleFriendRequestAccepted);
            socket.off("newMessage", handleNewMessage);

        };


    }, []);


    return (
        <div className="w-full md:w-[350px] bg-white border-r border-gray-200 flex flex-col h-full">

            <div className="p-5 border-b bg-white">

                <div className="flex items-center justify-between mb-5">

                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Chats
                        </h2>

                        <p className="text-sm text-gray-400 mt-1">
                            Your recent conversations
                        </p>
                    </div>

                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg">
                        💬
                    </div>

                    <div className="relative">

                        <span className="absolute left-3 top-2.5 text-gray-400">
                            🔍
                        </span>

                        <input
                            type="text"
                            value={search}
                            onChange={(e) =>
                                handleSearch(e.target.value)
                            }
                            placeholder="Search users..."
                            className="w-full bg-gray-100 border border-transparent rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <FriendRequests
                        onConversationCreated={(conversation) => {

                            setConversations((prev) => {

                                const alreadyExists = prev.some(
                                    (item) =>
                                        item._id === conversation._id
                                );

                                if (alreadyExists) {
                                    return prev;
                                }

                                return [
                                    conversation,
                                    ...prev,
                                ];
                            });

                            onConversationCreated(conversation);
                        }}
                    />
                </div>

                {search && (
                    <div className="border-b max-h-60 overflow-y-auto">

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

                                <div
                                    key={user._id}
                                    className="w-full flex items-center gap-3 px-4 py-4 border-b border-gray-100 hover:bg-blue-50 transition"
                                >
                                    <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                                        {user.name?.charAt(0).toUpperCase()}
                                    </div>

                                    <div className="flex-1 min-w-0">

                                        <p className="font-semibold text-gray-900">
                                            {user.name}
                                        </p>

                                        <p className="text-sm text-gray-500 truncate">
                                            {user.email}
                                        </p>

                                    </div>
                                    <button
                                        onClick={() => {
                                            const isFollowed = followedUsers.some(
                                                (id) =>
                                                    id?.toString() ===
                                                    user?._id?.toString()
                                            );

                                            const isPending = pendingRequests.some(
                                                (id) =>
                                                    id?.toString() ===
                                                    user?._id?.toString()
                                            );

                                            if (isFollowed) {
                                                handleFollowedUserClick(user);
                                            } else if (isPending) {
                                                return;
                                            } else {
                                                handleSendRequest(user._id);
                                            }
                                        }}
                                        className={`px-3 py-2 text-xs font-semibold rounded-lg ${followedUsers.some(
                                            (id) =>
                                                id?.toString() ===
                                                user?._id?.toString()
                                        )
                                                ? "bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer"
                                                : pendingRequests.some(
                                                    (id) =>
                                                        id?.toString() ===
                                                        user?._id?.toString()
                                                )
                                                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                    : "bg-blue-600 text-white hover:bg-blue-700"
                                            }`}
                                    >
                                        {followedUsers.some(
                                            (id) =>
                                                id?.toString() ===
                                                user?._id?.toString()
                                        )
                                            ? "Followed"
                                            : pendingRequests.some(
                                                (id) =>
                                                    id?.toString() ===
                                                    user?._id?.toString()
                                            )
                                                ? "Pending"
                                                : "Add"}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto">

                    {loading ? (
                        <p className="p-4 text-gray-500">
                            Loading chats...
                        </p>

                    ) : conversations.length === 0 ? (

                        <div className="p-8 text-center">

                            <div className="text-4xl mb-3">
                                💭
                            </div>

                            <p className="p-4 text-gray-500">
                                No conversations yet
                            </p>

                            <p className="text-sm text-gray-400 mt-1">
                                Search for someone to start chatting
                            </p>

                        </div>

                    ) : (
                        conversations.map((conversation) => {

                            const currentUserId =
                                localStorage.getItem("userId");

                            const otherUser =
                                conversation.participants?.find((user) => {
                                    const userId = user?._id || user;

                                    return (
                                        userId?.toString() !==
                                        currentUserId?.toString()
                                    );
                                });
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
                                    className="w-full text-left p-4 border-b hover:bg-gray-100 hover:bg-gray-50 transition"
                                >

                                    <div className="relative">

                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg">

                                            {otherUser?.name
                                                ?.charAt(0)
                                                .toUpperCase() || "U"}

                                        </div>

                                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />

                                    </div>

                                    <div className="flex-1 min-w-0 text-left">

                                        <div className="flex justify-between items-center">

                                            <p className="font-semibold text-gray-900 truncate">

                                                {otherUser?.name ||
                                                    "Unknown User"}

                                            </p>

                                            {conversation.lastMessage && (
                                                <span className="text-[10px] text-gray-400 ml-2">
                                                    {new Date(
                                                        conversation.lastMessage.createdAt
                                                    ).toLocaleTimeString(
                                                        [],
                                                        {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        }
                                                    )}
                                                </span>
                                            )}

                                        </div>

                                        <div className="flex justify-between items-center">

                                            <p className="text-sm text-gray-500 truncate max-w-[210px]">

                                                {conversation.lastMessage
                                                    ?.text ||
                                                    "No messages yet"}

                                            </p>

                                            {conversation.unreadCount > 0 && (

                                                <span className="ml-2 min-w-5 h-5 px-1.5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">

                                                    {conversation.unreadCount}

                                                </span>

                                            )}

                                        </div>

                                    </div>

                                </button>

                            );

                        })

                    )}

                </div>

                <div className="p-4 border-t bg-gray-50">

                    <div className="flex items-center gap-3">

                        <div className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold">
                            U
                        </div>

                        <div>

                            <p className="font-semibold text-sm">
                                My Account
                            </p>

                            <p className="text-xs text-green-600">
                                ● Online
                            </p>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}
export default ChatSidebar;