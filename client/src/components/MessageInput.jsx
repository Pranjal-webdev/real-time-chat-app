import { useState } from "react";
import axios from "axios";
import socket from "../socket/socket";
import { useRef } from "react";

const MessageInput = ({ conversationId, onMessageSent, replyTo, onCancelReply }) => {

    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);


    const handleFileChange = async (e) => {
        const file = e.target.files[0];

        if (!file) return;

        try {
            setUploading(true);

            const token = localStorage.getItem("token");

            const formData = new FormData();

            formData.append(
                "conversationId",
                conversationId
            );

            formData.append("file", file);

            const response = await axios.post(
                "http://localhost:5001/api/messages/upload",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            onMessageSent(response.data.message);

        } catch (error) {
            console.error(
                "File Upload Error:",
                error.response?.data || error.message
            );
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!message.trim() || sending) return;

        try {
            setSending(true);

            const token = localStorage.getItem("token");

            const response = await axios.post(
                "http://localhost:5001/api/messages",
                {
                    conversationId,
                    text: message.trim(),
                    replyTo: replyTo?._id || null,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            onMessageSent(response.data.message);

            setMessage("");

        } catch (error) {
            console.error(
                "Send Message Error:",
                error.response?.data || error.message
            );

        } finally {
            setSending(false);
        }
    };

    return (

        <form
            onSubmit={handleSubmit}
            className="bg-white border-t p-4 flex gap-3"
        >

            {replyTo && (
                <div className="bg-gray-100 border-l-4 border-blue-600 p-3 rounded">
                    <div className="flex justify-between">
                        <p className="text-sm font-semibold">
                            Replying to {replyTo.sender?.name || "User"}
                        </p>

                        <button
                            type="button"
                            onClick={onCancelReply}
                            className="text-gray-500"
                        >
                            ✕
                        </button>
                    </div>

                    <p className="text-sm text-gray-600 truncate">
                        {replyTo.text}
                    </p>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
            />

            <button
                type="button"
                onClick={() =>
                    fileInputRef.current?.click()
                }
                disabled={uploading}
                className="bg-gray-200 px-4 rounded-lg"
            >
                {uploading ? "Uploading..." : "📎"}
            </button>
            
            <input
                type="text"
                value={message}
                onChange={(e) => {
                    setMessage(e.target.value);

                    if (e.target.value.trim()) {
                        socket.emit("typing", conversationId);
                    } else {
                        socket.emit("stopTyping", conversationId);
                    }
                }}
                onBlur={() => {
                    socket.emit("stopTyping", conversationId);
                }}
                placeholder="Type a message..."
                className="flex-1 border rounded-lg px-4 py-3 outline-none"
            />

            <button
                type="submit"
                className="bg-blue-600 text-white px-6 rounded-lg"
            >
                {sending ? "Sending..." : "Send"}

            </button>
        </form>
    );
};

export default MessageInput;