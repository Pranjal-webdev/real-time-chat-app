import { useEffect } from "react";
import socket from "./socket/socket";
import Chat from "./pages/Chat";

function App() {

    useEffect(() => {
        socket.connect();

        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);

            const userId = localStorage.getItem("userId");

            if (userId) {
                socket.emit("userOnline", userId);
            }

            });

        socket.on("disconnect", () => {
            console.log("Socket disconnected");
        });

        return () => {
            socket.off("connect");
            socket.off("disconnect");
            socket.disconnect();
        };

    }, []);

    return <Chat />;
}

export default App;