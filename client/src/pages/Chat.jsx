import { useState } from "react";
import ChatSidebar from "../components/ChatSidebar";
import ChatWindow from "../components/ChatWindow";

const Chat = () => {

    const [selectedConversation, setSelectedConversation] = useState(null);

    return (

        <div className="h-screen w-full bg-gray-100 flex overflow-hidden">

            <ChatSidebar onSelectConversation={setSelectedConversation}
                onConversationCreated={(conversation) => {
                    setSelectedConversation(conversation);
                }}
            />
            
            {selectedConversation ? (
                <ChatWindow
                    conversation={selectedConversation}
                />

            ) : (
                <div className="flex-1 flex items-center justify-center bg-slate-50">

                    <div className="text-center">

                        <div className="w-24 h-24 mx-auto rounded-full bg-blue-100 flex items-center justify-center text-5xl mb-5">
                            💬
                        </div>

                        <h1 className="text-3xl font-bold text-gray-800">
                            Welcome to ChatApp
                        </h1>

                        <p className="text-gray-500 mt-2">
                            Select a conversation and start messaging
                        </p>

                    </div>

                </div>
            )}
        </div>
    );
};

export default Chat;