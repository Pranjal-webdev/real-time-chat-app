import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import socket from "./socket/socket";

import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Register from "./pages/Register";
import FriendRequestsPage from "./components/FriendRequestsPage";
import FriendsPage from "./components/FriendsPage";

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

        socket.on("connect", handleConnect);

        socket.connect();

        if (socket.connected) {
            handleConnect();
        }

        return () => {
            socket.off("connect", handleConnect);
            socket.disconnect();
        };
    }, [isAuthenticated]);

    return (
        <BrowserRouter>
            {!isAuthenticated ? (
                showRegister ? (
                    <Register
                        onLogin={() => setShowRegister(false)}
                        onRegisterSuccess={() => {
                            setIsAuthenticated(true);
                        }}
                    />
                ) : (
                    <Login
                        onRegister={() => setShowRegister(true)}
                        onLoginSuccess={() => {
                            setIsAuthenticated(true);
                        }}
                    />
                )
            ) : (
                <Routes>
                    <Route path="/chat" element={<Chat />} />

                    <Route path="/friends" element={<FriendsPage />} />

                    <Route
                        path="/friend-requests"
                        element={<FriendRequestsPage />}
                    />

                    <Route
                        path="*"
                        element={<Navigate to="/chat" replace />}
                    />
                    
                </Routes>
            )}
        </BrowserRouter>
    );
}

export default App;