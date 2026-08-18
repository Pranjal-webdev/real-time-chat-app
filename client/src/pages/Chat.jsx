import ChatSidebar from "../components/ChatSidebar";
import ChatWindow from "../components/ChatWindow";

const Chat = () => {
    return (
        <div className="h-screen flex bg-gray-100">
            <ChatSidebar />
            <ChatWindow />
        </div>
    );
};

export default Chat;