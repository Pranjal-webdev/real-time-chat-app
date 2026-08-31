import { useState } from "react";
import axios from "axios";

const Login = ({ onRegister, onLoginSuccess }) => {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await axios.post(
                "http://localhost:5001/api/auth/login",
                {
                    email,
                    password,
                }
            );

            const { token, user } = response.data;

            localStorage.setItem("token", token);
            localStorage.setItem("userId", user._id);

            onLoginSuccess();

            navigate("/chat");

        } catch (error) {
            console.error(
                "Login Error:",
                error.response?.data || error.message
            );

            setError(
                error.response?.data?.message ||
                "Login failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">

            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

                <h1 className="text-3xl font-bold text-center text-gray-900">
                    Welcome Back
                </h1>

                <p className="text-center text-gray-500 mt-2 mb-8">
                    Login to continue chatting
                </p>

                {error && (
                    <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form
                    onSubmit={handleLogin}
                    className="space-y-5"
                >

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Email
                        </label>

                        <input
                            type="email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            placeholder="Enter your email"
                            required
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Password
                        </label>

                        <input
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            placeholder="Enter your password"
                            required
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>

                </form>

                <div className="text-center mt-6">

                    <p className="text-sm text-gray-500">
                        Don't have an account?
                    </p>

                    <button
                        type="button"
                        onClick={onRegister}
                        className="text-blue-600 font-semibold mt-1 hover:underline"
                    >
                        Create Account
                    </button>

                </div>

            </div>

        </div>
    );
};

export default Login;