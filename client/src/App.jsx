import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import socket from "./socket/socket";

import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Register from "./pages/Register";
import FriendRequestsPage from "./components/FriendRequestsPage";
import FriendsPage from "./components/FriendsPage";

function App() {

    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));
    const [loading, setLoading] = useState(true);
    const [showRegister, setShowRegister] = useState(false);

    useEffect(() => {
        setLoading(false);
    }, []);


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

        socket.auth = {
            token: localStorage.getItem("token"),
        };

        socket.connect();

        socket.connect();

        if (socket.connected) {
            handleConnect();
        }

        return () => {
            socket.off("connect", handleConnect);
            socket.disconnect();
        };
    }, [isAuthenticated]);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

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