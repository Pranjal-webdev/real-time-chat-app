const ChatSidebar = () => {
    return (
        <div className="w-80 bg-white border-r border-gray-200">
            <div className="p-5 border-b">
                <h2 className="text-xl font-bold">
                    Chats
                </h2>
            </div>

            <div className="p-4">
                <p className="text-gray-500">
                    No conversations yet
                </p>
            </div>
        </div>
    );
};

export default ChatSidebar;