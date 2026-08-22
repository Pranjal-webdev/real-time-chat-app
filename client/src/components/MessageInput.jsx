import { useState } from "react";
import axios from "axios";


const MessageInput = ({ conversationId,onMessageSent }) => {

    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);

    const handleSubmit =  async (e) => {
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
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
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