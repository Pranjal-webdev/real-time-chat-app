import { useEffect } from "react";
import socket from "./socket/socket";
import Chat from "./pages/Chat";

function App() {
    
    useEffect(() => {
        socket.connect();

        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);

            socket.emit("joinConversation", "6a83193403d17d711ce29ef5");
        });

        socket.on("newMessage", (message) => {
            console.log("New message received:", message);
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected");
        });

        return () => {
            socket.off("connect");
            socket.off("newMessage");
            socket.off("disconnect");
            socket.disconnect();
        };
    }, []);

    return <Chat />;
}

export default App;