import { useEffect, useState } from "react";
import socket from "./socket/socket";

import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {

    const [isAuthenticated, setIsAuthenticated] = useState(
        !!localStorage.getItem("token")
    );

    const [showRegister, setShowRegister] = useState(false);

    useEffect(() => {

        if (!isAuthenticated) {
            return;
        }

        socket.connect();

        const handleConnect = () => {
            console.log("Socket connected:", socket.id);

            const userId = localStorage.getItem("userId");

            if (userId) {
                socket.emit("userOnline", userId);
            }
        };

        const handleDisconnect = () => {
            console.log("Socket disconnected");
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.disconnect();
        };

    }, [isAuthenticated]);

    
    if (!isAuthenticated) {

        if (showRegister) {
            return (
                <Register
                    onLogin={() => setShowRegister(false)}
                    onRegisterSuccess={() => setShowRegister(false)}
                />
            );
        }

        return (
            <Login
                onRegister={() => setShowRegister(true)}
                onLoginSuccess={() => setIsAuthenticated(true)}
            />
        );
    }

    return <Chat />;
}

export default App;