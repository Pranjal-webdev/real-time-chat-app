import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import socket from "./socket/socket";

import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Register from "./pages/Register";
import FriendRequestsPage from "./components/FriendRequestsPage";

function App() {

    const [isAuthenticated, setIsAuthenticated] = useState(
        !!localStorage.getItem("token")
    );

    const [showRegister, setShowRegister] = useState(false);

    useEffect(() => {

        if (!isAuthenticated) {
            return;
        }

        const handleConnect = () => {
            console.log("Socket connected:", socket.id);

            const userId = localStorage.getItem("userId");

            console.log("MY USER ID:", userId);

            if (userId) {
                socket.emit("userOnline", userId);
            }
        };

        const handleDisconnect = () => {
            console.log("Socket disconnected");
        };

        // FIRST listeners
        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);

        // THEN connect
        socket.connect();

        // If already connected
        if (socket.connected) {
            handleConnect();
        }

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


    return (
        <BrowserRouter>

            <Routes>

                <Route
                    path="/chat"
                    element={<Chat />}
                />

                <Route
                    path="/friend-requests"
                    element={<FriendRequestsPage />}
                />

                <Route
                    path="*"
                    element={<Navigate to="/chat" />}
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;