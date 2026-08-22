import { useEffect, useState } from "react";
import axios from "axios";

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

                console.log("CONVERSATION RESPONSE:", response.data);

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
    }, []);

    return (
        <div className="w-80 bg-white border-r border-gray-200 h-full">

            {/* Header */}
            <div className="p-5 border-b">
                <h2 className="text-xl font-bold">
                    Chats
                </h2>
            </div>

            {/* Conversations */}
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
                            onClick={() =>
                                onSelectConversation(conversation)
                            }
                            className="w-full text-left p-4 border-b hover:bg-gray-100"
                        >
                            <p className="font-semibold">
                                Chat
                            </p>

                            <p className="text-sm text-gray-500">
                                {conversation.lastMessage?.text ||
                                    "No messages yet"}
                            </p>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};

export default ChatSidebar;