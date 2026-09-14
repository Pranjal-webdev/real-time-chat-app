import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ChatSidebar from "../components/ChatSidebar";
import ChatWindow from "../components/ChatWindow";

const Chat = () => {

    const [selectedConversation, setSelectedConversation] = useState(null);

    const location = useLocation();

    useEffect(() => {
        if (location.state?.conversation) {
            setSelectedConversation(
                location.state.conversation
            );

            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            );
        }
    }, [location.state]);


    console.log("SELECTED CONVERSATION:", selectedConversation);

    return (
        <div className="h-screen w-full bg-gray-100 flex overflow-hidden">

            <div
                className={`${selectedConversation ? "hidden" : "block"
                    } w-full md:w-96 shrink-0`}
            >
                <ChatSidebar
                    onSelectConversation={setSelectedConversation}
                    onConversationCreated={(conversation) => {
                        setSelectedConversation(conversation);
                    }}
                />
            </div>

            <div
                className={`${selectedConversation ? "flex" : "flex"
                    } w-full min-w-0`}
            >
                {selectedConversation ? (
                    <ChatWindow conversation={selectedConversation}
                        onBack={() => setSelectedConversation(null)}
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

        </div>
    );
};

export default Chat;