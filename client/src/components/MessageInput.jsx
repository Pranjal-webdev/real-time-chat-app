import { useState, useEffect, useRef } from "react";
import axios from "axios";
import socket from "../socket/socket";

const MessageInput = ({ conversationId, onMessageSent, replyTo, onCancelReply, onImageUploadStart }) => {

    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const typingTimeoutRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];

        if (!file) return;

        let localPreview = null;

        try {
            setSelectedFile(file);

            if (file.type.startsWith("image/")) {
                localPreview = URL.createObjectURL(file);
                setPreviewUrl(localPreview);
            } else {
                setPreviewUrl(null);
            }

            setUploading(true);

            onImageUploadStart?.(file);

            const token = localStorage.getItem("token");

            const formData = new FormData();

            formData.append("conversationId", conversationId);
            formData.append("file", file);

            const response = await axios.post(
                "https://https://real-time-chat-app-backend-1qh4.onrender.com://https://real-time-chat-app-backend-1qh4.onrender.com/api/messages/upload",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            onMessageSent(response.data.message, true);

            

        } catch (error) {
            console.error(
                "File Upload Error:",
                error.response?.data || error.message
            );
        } finally {
            setUploading(false);
            setSelectedFile(null);
            setPreviewUrl(null);

            if (localPreview) {
                URL.revokeObjectURL(localPreview);
            }

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
                "https://https://real-time-chat-app-backend-1qh4.onrender.com://https://real-time-chat-app-backend-1qh4.onrender.com/api/messages",
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
            console.log("STATUS:", error.response?.status);
            console.log("DATA:", error.response?.data);
            console.log("ERROR:", error.message);

        } finally {
            setSending(false);
        }
    };

    useEffect(() => {
        return () => {
            clearTimeout(typingTimeoutRef.current);
            socket.emit("stopTyping", conversationId);
        };
    }, [conversationId]);


    return (
        <div className="bg-white border-t px-5 py-4">

            {/* Attachment Preview */}
            {selectedFile && (
                <div className="mb-3 p-3 bg-gray-100 rounded-xl flex items-center gap-3">

                    {previewUrl ? (
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-20 h-20 object-cover rounded-lg"
                        />
                    ) : (
                        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-3xl">
                            📎
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                            {selectedFile.name}
                        </p>

                        {uploading && (
                            <p className="text-xs text-gray-500 mt-1">
                                Uploading...
                            </p>
                        )}
                    </div>

                    {uploading && (
                        <div className="w-6 h-6 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                    )}
                </div>
            )}

            {replyTo && (
                <div className="bg-gray-100 border-l-4 border-blue-600 p-3 rounded mb-3">
                    <div className="flex justify-between items-center">

                        <p className="text-sm font-semibold">
                            Replying to {replyTo.sender?.name || "User"}
                        </p>

                        <button
                            type="button"
                            onClick={onCancelReply}
                            className="text-gray-500 hover:text-gray-800"
                        >
                            ✕
                        </button>
                    </div>

                    <p className="text-sm text-gray-600 truncate mt-1">
                        {replyTo.text || "Attachment"}
                    </p>
                </div>
            )}


            <form
                onSubmit={handleSubmit}
                className="w-full flex gap-3 items-center"
            >


                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                />


                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending || uploading}
                    className="bg-gray-200 px-4 py-3 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                >
                    {uploading ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-blue-600 rounded-full animate-spin" />
                            <span>Uploading...</span>
                        </div>
                    ) : (
                        "📎"
                    )}
                </button>


                <input
                    type="text"
                    value={message}
                    onChange={(e) => {
                        const value = e.target.value;

                        setMessage(value);

                        if (value.trim()) {
                            socket.emit("typing", conversationId);

                            clearTimeout(typingTimeoutRef.current);

                            typingTimeoutRef.current = setTimeout(() => {
                                socket.emit("stopTyping", conversationId);
                            }, 1000);
                        } else {
                            clearTimeout(typingTimeoutRef.current);
                            socket.emit("stopTyping", conversationId);
                        }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 min-w-0 border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />


                <button
                    type="submit"
                    disabled={sending || !message.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-7 py-3 rounded-xl font-semibold transition"
                >
                    {sending ? "Sending..." : "Send"}
                </button>

            </form>
        </div>
    );
};

export default MessageInput;