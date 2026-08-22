import { useEffect, useState } from "react";
import axios from "axios";
import socket from "../socket/socket";
import MessageInput from "./MessageInput";

const ChatWindow = ({conversation}) => {

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    const currentUserId = localStorage.getItem("userId");


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

            socket.emit(
                "joinConversation",
                conversation._id
            );
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
                setMessages((prev) => [
                    ...prev,
                    message,
                ]);
            }
        };

        socket.on("connect", handleConnect);
        socket.on("newMessage", handleNewMessage);


        if (socket.connected) {

            socket.emit(
                "joinConversation",
                conversation._id
            );
        };

        return () => {
            socket.off("connect", handleConnect);
            socket.off("newMessage", handleNewMessage);
        };
    }, [conversation]);


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
                    Chat
                </h2>
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
                                    className={`flex ${
                                        isMine
                                            ? "justify-end"
                                            : "justify-start"
                                    }`}
                                >
                                    <div
                                        className={`max-w-md px-4 py-3 rounded-2xl ${
                                            isMine
                                                ? "bg-blue-600 text-white rounded-br-none"
                                                : "bg-white text-gray-800 rounded-bl-none shadow-sm"
                                        }`}
                                    >
                                        <p>
                                            {message.text}
                                        </p>

                                        <p
                                            className={`text-xs mt-1 ${
                                                isMine
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
                                    </div>
                                </div>
                            );
                        })}

                    </div>
                )}

            </div>

            <MessageInput
                conversationId={conversation._id}
                onMessageSent={(message) => {
                    setMessages((prev) => [
                        ...prev,
                        message,
                    ]);
                }}
            />

        </div>
    )
};

export default ChatWindow;