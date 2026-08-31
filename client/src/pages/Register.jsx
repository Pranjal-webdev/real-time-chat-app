import { useState } from "react";
import axios from "axios";

const Register = ({ onLogin, onRegisterSuccess }) => {

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleRegister = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const response = await axios.post(
                "http://localhost:5001/api/auth/register",
                {
                    name,
                    email,
                    password,
                }
            );

            console.log("Register Response:", response.data);

            setSuccess("Account created successfully! Please login.");

            onRegisterSuccess();

            setName("");
            setEmail("");
            setPassword("");

        } catch (error) {
            console.error(
                "Register Error:",
                error.response?.data || error.message
            );

            setError(
                error.response?.data?.message ||
                "Registration failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">

            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

                <div className="text-center mb-8">

                    <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl mb-4">
                        💬
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900">
                        Create Account
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Join the conversation
                    </p>

                </div>

                {error && (
                    <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm">
                        {success}
                    </div>
                )}

                <form
                    onSubmit={handleRegister}
                    className="space-y-5"
                >

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Name
                        </label>

                        <input
                            type="text"
                            value={name}
                            onChange={(e) =>
                                setName(e.target.value)
                            }
                            placeholder="Enter your name"
                            required
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

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
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                            placeholder="Create a password"
                            required
                            minLength={6}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {loading
                            ? "Creating Account..."
                            : "Create Account"}
                    </button>

                </form>

                <div className="text-center mt-6">

                    <p className="text-sm text-gray-500">
                        Already have an account?
                    </p>

                    <button
                        onClick={onLogin}
                        className="text-blue-600 font-semibold mt-1 hover:underline"
                    >
                        Login
                    </button>

                </div>

            </div>

        </div>
    );
};

export default Register;