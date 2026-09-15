import { useEffect, useState } from "react";
import axios from "axios";
import socket from "../socket/socket";
import { useNavigate } from "react-router-dom";


const ChatSidebar = ({ onSelectConversation, onConversationCreated }) => {

    const navigate = useNavigate();

    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState([]);
    const [searching, setSearching] = useState(false);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [followedUsers, setFollowedUsers] = useState([]);
    const [receivedRequestsCount, setReceivedRequestsCount] = useState(0);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [socketConnected, setSocketConnected] = useState(socket.connected);
    const [friends, setFriends] = useState([]);
    const [loggingOut, setLoggingOut] = useState(false);
    const [profileImage, setProfileImage] = useState(
        localStorage.getItem("profileImage") || ""
    );
    const [uploadingProfile, setUploadingProfile] = useState(false);


    const handleProfileImageChange = async (event) => {

        const file = event.target.files[0];

        if (!file) return;

        try {
            setUploadingProfile(true);

            const token = localStorage.getItem("token");

            const formData = new FormData();
            formData.append("profileImage", file);

            const response = await axios.put(
                "http://https://real-time-chat-app-backend-1qh4.onrender.com/api/users/profile-image",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const image = response.data.user.profileImage;

            setProfileImage(image);
            localStorage.setItem("profileImage", image);

        } catch (error) {
            console.error(
                "Profile Image Upload Error:",
                error.response?.data || error.message
            );
        } finally {
            setUploadingProfile(false);
            event.target.value = "";
        }
    };


    const fetchReceivedRequestsCount = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await axios.get(
                "http://https://real-time-chat-app-backend-1qh4.onrender.com/api/friend-requests/received",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setReceivedRequestsCount(
                response.data.requests?.length || 0
            );

        } catch (error) {
            console.error(
                "Fetch Received Requests Error:",
                error.response?.data || error.message
            );
        }
    };


    useEffect(() => {

        const fetchFriends = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await axios.get(
                    "http://https://real-time-chat-app-backend-1qh4.onrender.com/api/friend-requests/friends",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                setFriends(response.data.friends || []);
            } catch (error) {
                console.error(
                    "Fetch Friends Error:",
                    error.response?.data || error.message
                );
            }
        };

        fetchFriends();
    }, []);


    useEffect(() => {

        fetchReceivedRequestsCount();

        const handleSocketConnect = () => {
            setSocketConnected(true);
        };

        const handleSocketDisconnect = () => {
            setSocketConnected(false);
        };

        socket.on("connect", handleSocketConnect);
        socket.on("disconnect", handleSocketDisconnect);

        socket.off("connect", handleSocketConnect);
        socket.off("disconnect", handleSocketDisconnect);

    }, []);


    const fetchSentRequests = async () => {

        try {
            const token = localStorage.getItem("token");

            const response = await axios.get(
                "http://https://real-time-chat-app-backend-1qh4.onrender.com/api/friend-requests/sent",
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
                `http://https://real-time-chat-app-backend-1qh4.onrender.com/api/users/search?search=${value}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const currentUserId = localStorage.getItem("userId");

            const filteredUsers = (response.data.users || []).filter(
                (user) =>
                    user._id?.toString() !== currentUserId?.toString()
            );

            const sortedUsers = [...filteredUsers].sort((a, b) => {
                const aIsFriend = friends.some(
                    (friend) =>
                        friend._id?.toString() === a._id?.toString()
                );

                const bIsFriend = friends.some(
                    (friend) =>
                        friend._id?.toString() === b._id?.toString()
                );

                if (aIsFriend && !bIsFriend) return -1;
                if (!aIsFriend && bIsFriend) return 1;

                return 0;
            });

            setUsers(sortedUsers);

        } catch (error) {

            console.error(
                "Search Users Error:",
                error.response?.data || error.message
            );
        } finally {
            setSearching(false);
        }
    };


    const handleLogout = () => {

        setLoggingOut(true);

        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("userName");
        localStorage.removeItem("profileImage");


        window.location.reload();
    };


    const handleSendRequest = async (userId) => {

        console.log("USER ID:", userId);

        try {
            const token = localStorage.getItem("token");

            await axios.post(
                "http://https://real-time-chat-app-backend-1qh4.onrender.com/api/friend-requests",

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
                    "http://https://real-time-chat-app-backend-1qh4.onrender.com/api/conversations",
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

        const handleSocketConnect = () => {
            setSocketConnected(true);
        };

        const handleSocketDisconnect = () => {
            setSocketConnected(false);
        };

        socket.on("connect", handleSocketConnect);
        socket.on("disconnect", handleSocketDisconnect);

        return () => {
            socket.off("connect", handleSocketConnect);
            socket.off("disconnect", handleSocketDisconnect);
        };
    }, []);


    useEffect(() => {

        const fetchConversations = async () => {

            try {
                const token = localStorage.getItem("token");

                const response = await axios.get(

                    "http://https://real-time-chat-app-backend-1qh4.onrender.com/api/conversations",
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


        const handleOnlineUsers = ({ userIds }) => {
            setOnlineUsers(userIds || []);
        };

        const handleUserOnline = ({ userId }) => {
            setOnlineUsers((prev) =>
                prev.includes(userId?.toString())
                    ? prev
                    : [...prev, userId?.toString()]
            );
        };

        const handleUserOffline = ({ userId }) => {
            setOnlineUsers((prev) =>
                prev.filter(
                    (id) => id?.toString() !== userId?.toString()
                )
            );
        };

        socket.on("onlineUsers", handleOnlineUsers);
        socket.on("userOnline", handleUserOnline);
        socket.on("userOffline", handleUserOffline);

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

            socket.off("onlineUsers", handleOnlineUsers);
            socket.off("userOnline", handleUserOnline);
            socket.off("userOffline", handleUserOffline);

        };


    }, []);


    return (
        <div className="flex flex-col h-full">

            <div className="p-4 sm:p-5 border-b bg-white">

                <div className="flex flex-col gap-3">

                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Chats
                        </h2>

                        <p className="text-sm text-gray-400 mt-1">
                            Your recent conversations
                        </p>

                        <div className="flex items-center gap-3 mt-3">
                            <label className="relative cursor-pointer">
                                {uploadingProfile ? (
                                    <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-blue-200 flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                                    </div>
                                ) : profileImage ? (
                                    <img
                                        src={
                                            profileImage.startsWith("http")
                                                ? profileImage
                                                : `http://https://real-time-chat-app-backend-1qh4.onrender.com${profileImage}`
                                        }
                                        alt="Profile"
                                        className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                                        {localStorage.getItem("userName")
                                            ?.charAt(0)
                                            .toUpperCase() || "U"}
                                    </div>
                                )}

                                {!uploadingProfile && (
                                    <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs border-2 border-white">
                                        ✎
                                    </div>
                                )}

                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleProfileImageChange}
                                    className="hidden"
                                    disabled={uploadingProfile}
                                />
                            </label>

                            <div className="min-w-0">
                                <p className="font-semibold text-gray-900 truncate">
                                    {localStorage.getItem("userName")}
                                </p>

                                <p className="text-xs text-gray-500">
                                    {uploadingProfile
                                        ? "Uploading..."
                                        : "Change profile picture"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="relative w-full">
                        <span className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-400">
                            🔍
                        </span>

                        <input
                            type="text"
                            value={search}
                            onChange={(e) =>
                                handleSearch(e.target.value)
                            }
                            placeholder="Search"
                            className="w-full bg-gray-100 border border-transparent rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div
                        onClick={() => navigate("/friend-requests")}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition"
                    >
                        <div>
                            <p className="font-semibold text-gray-800">
                                Friend Requests
                            </p>

                            <p className="text-xs text-gray-400 mt-1">
                                View your requests
                            </p>
                        </div>

                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                            {receivedRequestsCount}
                        </div>
                    </div>

                </div>

                {search && (
                    <div className="border-b max-h-60 overflow-y-auto mt-3">

                        {searching ? (
                            <p className="p-4 text-center text-gray-500">
                                Searching...
                            </p>

                        ) : users.length === 0 ? (
                            <p className="p-4 text-center text-gray-500">
                                No users found
                            </p>

                        ) : (
                            users.map((user) => (

                                <div
                                    key={user._id}
                                    className="w-full flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-4 border-b border-gray-100 hover:bg-blue-50 transition"
                                >
                                    {user.profileImage ? (
                                        <img
                                            src={
                                                user.profileImage.startsWith("http")
                                                    ? user.profileImage
                                                    : `http://https://real-time-chat-app-backend-1qh4.onrender.com${user.profileImage}`
                                            }
                                            alt={user.name}
                                            className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 rounded-full object-cover border border-gray-200"
                                        />
                                    ) : (

                                        <div className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                                            {user.name?.charAt(0).toUpperCase() || "U"}
                                        </div>
                                    )}


                                    <div className="flex-1 min-w-0">

                                        <p className="font-semibold text-gray-900 truncate">
                                            {user.name}
                                        </p>

                                        <p className="text-sm text-gray-500 truncate">
                                            {user.email}
                                        </p>

                                    </div>

                                    <button
                                        onClick={() => {
                                            const isFollowed =
                                                followedUsers.some(
                                                    (id) =>
                                                        id?.toString() ===
                                                        user?._id?.toString()
                                                );

                                            const isPending =
                                                pendingRequests.some(
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
                                        className={`px-3 py-2 shrink-0 text-xs font-semibold rounded-lg ${followedUsers.some(
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

            </div>

            <div className="flex-1 overflow-y-auto">

                <button
                    type="button"
                    onClick={() => navigate("/friends")}
                    className="w-full px-4 sm:px-5 py-4 bg-white border-b flex items-center justify-between text-left hover:bg-blue-50 transition"
                >
                    <div>
                        <p className="text-sm font-semibold text-gray-700">
                            Friends
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                            View all your friends
                        </p>
                    </div>

                    <span className="text-gray-400 text-lg">
                        👥
                    </span>
                </button>


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

                                const userId =
                                    user?._id || user;

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
                                className="w-full flex items-center gap-3 text-left p-3 sm:p-4 border-b hover:bg-gray-50 transition"
                            >

                                <div className="relative shrink-0">

                                    {otherUser?.profileImage ? (
                                        <img
                                            src={
                                                otherUser.profileImage.startsWith("http")
                                                    ? otherUser.profileImage
                                                    : `http://https://real-time-chat-app-backend-1qh4.onrender.com${otherUser.profileImage}`
                                            }
                                            alt={otherUser.name}
                                            className="w-12 h-12 shrink-0 rounded-full object-cover border border-gray-200"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                                            {otherUser?.name?.charAt(0).toUpperCase() || "U"}
                                        </div>
                                    )}

                                    <span
                                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white rounded-full ${onlineUsers.some(
                                            (id) =>
                                                id?.toString() ===
                                                otherUser?._id?.toString()
                                        )
                                            ? "bg-green-500"
                                            : "bg-black"
                                            }`}
                                    />

                                </div>


                                <div className="flex-1 min-w-0 text-left">

                                    <div className="flex justify-between items-center">

                                        <p className="font-semibold text-gray-900 truncate">
                                            {otherUser?.name ||
                                                "Unknown User"}
                                        </p>

                                        {conversation.lastMessage && (

                                            <span className="text-[10px] text-gray-400 ml-2 shrink-0">

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

                                        <p className="text-sm text-gray-500 truncate max-w-[160px] sm:max-w-[210px]">

                                            {conversation.lastMessage
                                                ?.text ||
                                                "No messages yet"}

                                        </p>

                                        {conversation.unreadCount > 0 && (

                                            <span className="ml-2 min-w-5 h-5 px-1.5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center shrink-0">

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


            <div className="p-3 sm:p-4 border-t bg-gray-50">

                <div className="flex items-center gap-3">

                    <div className="w-10 h-10 shrink-0 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold">
                        U
                    </div>

                    <div className="min-w-0">

                        <p className="font-semibold text-sm">
                            My Account
                        </p>

                        <p
                            className={`text-xs ${socketConnected
                                ? "text-green-600"
                                : "text-gray-500"
                                }`}
                        >
                            {socketConnected
                                ? "● Online"
                                : "● Offline"}
                        </p>

                    </div>

                </div>

            </div>

            <div className="p-3 sm:p-4 bg-white border-t">
                <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200 font-semibold transition text-sm sm:text-base"
                >
                    {loggingOut ? (
                        <>
                            <div className="w-5 h-5 border-2 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                            <span>Logging out...</span>
                        </>
                    ) : (
                        <>
                            <span className="text-lg">↪</span>
                            <span>Logout</span>
                        </>
                    )}
                </button>
            </div>

        </div>
    );
}

export default ChatSidebar;