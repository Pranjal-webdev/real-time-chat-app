import { useState } from "react";

const MessageInput = () => {
    const [message, setMessage] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!message.trim()) return;

        console.log("Message:", message);

        setMessage("");
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
                Send
            </button>
        </form>
    );
};

export default MessageInput;