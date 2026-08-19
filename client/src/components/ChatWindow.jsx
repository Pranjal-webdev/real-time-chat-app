import MessageInput from "./MessageInput";

const ChatWindow = () => {

    return (

        <div className="flex-1 flex flex-col">

            <div className="bg-white border-b p-5">

                <h2 className="font-semibold">
                    Select a conversation
                </h2>

            </div>

            <div className="flex-1 p-5 overflow-y-auto">
                
                <div className="text-center text-gray-500">
                    Select a chat to start messaging
                </div>
                
            </div>

            <MessageInput />

        </div>
    );
};

export default ChatWindow;