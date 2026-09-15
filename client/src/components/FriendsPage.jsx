import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const FriendsPage = () => {
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await axios.get(
                    "https://real-time-chat-app-backend-1qh4.onrender.com://real-time-chat-app-backend-1qh4.onrender.com/api/friend-requests/friends",
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
            } finally {
                setLoading(false);
            }
        };

        fetchFriends();
    }, []);

    const openFriendChat = async (friend) => {
        try {
            const token = localStorage.getItem("token");

            const response = await axios.get(
                "https://real-time-chat-app-backend-1qh4.onrender.com://real-time-chat-app-backend-1qh4.onrender.com/api/conversations",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const conversations =
                response.data.conversations || [];

            const conversation = conversations.find(
                (item) =>
                    item.participants?.some(
                        (participant) =>
                            (participant._id || participant).toString() ===
                            friend._id.toString()
                    )
            );

            if (conversation) {
                navigate("/chat", {
                    state: {
                        conversation,
                    },
                });
            }
        } catch (error) {
            console.error(
                "Open Friend Chat Error:",
                error.response?.data || error.message
            );
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">

            <div className="max-w-2xl mx-auto">

                <div className="p-4 sm:p-6 bg-white border-b flex items-center gap-3">

                    <button
                        type="button"
                        onClick={() => window.location.assign("/chat")}
                        className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-xl"
                    >
                        ❮
                    </button>

                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                            Friends
                        </h1>

                        <p className="text-sm text-gray-400">
                            {friends.length} friend{friends.length !== 1 ? "s" : ""}
                        </p>
                    </div>

                </div>

                <div className="bg-white">

                    {loading ? (

                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>

                            <p className="text-sm text-gray-500 mt-3">
                                Loading friends...
                            </p>
                        </div>

                    ) : friends.length === 0 ? (

                        <div className="p-10 text-center">
                            <div className="text-4xl mb-3">
                                👥
                            </div>

                            <p className="text-gray-500">
                                No friends yet
                            </p>
                        </div>

                    ) : (

                        <div>
                            {friends.map((friend) => (

                                <button
                                    key={friend._id}
                                    type="button"
                                    onClick={() =>
                                        openFriendChat(friend)
                                    }
                                    className="w-full flex items-center gap-3 sm:gap-4 p-4 border-b border-gray-100 text-left hover:bg-blue-50 active:bg-blue-100 transition"
                                >

                                    {friend.profileImage ? (

                                        <img
                                            src={
                                                friend.profileImage.startsWith(
                                                    "http"
                                                )
                                                    ? friend.profileImage
                                                    : `https://real-time-chat-app-backend-1qh4.onrender.com://real-time-chat-app-backend-1qh4.onrender.com${friend.profileImage}`
                                            }
                                            alt={friend.name}
                                            className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-full object-cover"
                                        />

                                    ) : (

                                        <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                                            {friend.name
                                                ?.charAt(0)
                                                .toUpperCase()}
                                        </div>

                                    )}

                                    <div className="min-w-0 flex-1">

                                        <p className="font-semibold text-gray-900 truncate">
                                            {friend.name}
                                        </p>

                                        <p className="text-sm text-gray-500 truncate">
                                            {friend.email}
                                        </p>

                                    </div>

                                    <span className="text-gray-400 text-xl shrink-0">
                                        →
                                    </span>

                                </button>

                            ))}
                        </div>

                    )}

                </div>

            </div>

        </div>
    );
};

export default FriendsPage;