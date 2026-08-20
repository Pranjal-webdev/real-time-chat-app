import { useState } from "react";
import ChatSidebar from "../components/ChatSidebar";
import ChatWindow from "../components/ChatWindow";

const Chat = () => {

    const [selectedConversation, setSelectedConversation] = useState(null);

    return (
        
        <div className="h-screen flex bg-gray-100">

            <ChatSidebar onSelectConversation={setSelectedConversation}/>
            <ChatWindow conversation={selectedConversation}/>

        </div>
    );
};

export default Chat;