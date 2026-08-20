import { useEffect, useState } from "react";
import axios from "axios";
import socket from "../socket/socket";
import MessageInput from "./MessageInput";

const ChatWindow = ({conversation}) => {

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);


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

        socket.connect();

        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);

            socket.emit(
                "joinConversation",
                conversation._id
            );
        });

        socket.on("newMessage", (message) => {
            console.log("New message received:", message);

            if (

                message.conversation?.toString() === conversation._id.toString() ||
                message.conversation?._id?.toString() ===
                    conversation._id.toString()

            ) {
                setMessages((prevMessages) => [
                    ...prevMessages,
                    message,
                ]);
            }
        });

        return () => {
            socket.off("connect");
            socket.off("newMessage");
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

        <div className="flex-1 flex flex-col">

            <div className="bg-white border-b p-5">

                <h2 className="font-semibold">
                     Chat
                </h2>
            </div>

            <div className="flex-1 p-5 overflow-y-auto space-y-3">

                {loading ? (
                    <p className="text-gray-500">
                        Loading messages...
                    </p>
                ) : messages.length === 0 ? (
                    <p className="text-center text-gray-500">
                        No messages yet
                    </p>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message._id}
                            className="bg-white p-3 rounded-lg shadow-sm max-w-md"
                        >
                            <p className="text-sm text-gray-800">
                                {message.text}
                            </p>
                        </div>
                    ))
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
    );
};

export default ChatWindow;