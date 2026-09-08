import { useEffect, useState } from "react";
import axios from "axios";

const FriendRequestsPage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await axios.get(
                "http://localhost:5001/api/friend-requests/received",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setRequests(response.data.requests || []);

        } catch (error) {
            console.error(
                "Fetch Friend Requests Error:",
                error.response?.data || error.message
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAccept = async (requestId) => {
        try {
            setProcessingId(requestId);

            const token = localStorage.getItem("token");

            await axios.post(
                `http://localhost:5001/api/friend-requests/${requestId}/accept`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setRequests((prev) =>
                prev.filter((request) => request._id !== requestId)
            );

        } catch (error) {
            console.error(
                "Accept Request Error:",
                error.response?.data || error.message
            );
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (requestId) => {
        try {
            setProcessingId(requestId);

            const token = localStorage.getItem("token");

            await axios.post(
                `http://localhost:5001/api/friend-requests/${requestId}/reject`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setRequests((prev) =>
                prev.filter((request) => request._id !== requestId)
            );

        } catch (error) {
            console.error(
                "Reject Request Error:",
                error.response?.data || error.message
            );
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <p className="text-gray-500">
                    Loading requests...
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">

            <div className="max-w-3xl mx-auto">

                <h1 className="text-3xl font-bold text-gray-900 mb-6">
                    Friend Requests
                </h1>

                {requests.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
                        <div className="text-5xl mb-4">
                            👥
                        </div>

                        <h2 className="text-xl font-semibold text-gray-800">
                            No requests found
                        </h2>

                        <p className="text-gray-500 mt-2">
                            You don't have any pending friend requests.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">

                        {requests.map((request) => {

                            const sender = request.sender;

                            return (
                                <div
                                    key={request._id}
                                    className="bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between gap-4"
                                >

                                    <div className="flex items-center gap-4 min-w-0">

                                        <div className="w-14 h-14 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl font-bold">
                                            {sender?.name
                                                ?.charAt(0)
                                                .toUpperCase() || "U"}
                                        </div>

                                        <div className="min-w-0">
                                            <h2 className="font-semibold text-gray-900">
                                                {sender?.name || "Unknown User"}
                                            </h2>

                                            <p className="text-sm text-gray-500 truncate">
                                                {sender?.email || ""}
                                            </p>

                                            <p className="text-sm text-gray-400 mt-1">
                                                Sent you a friend request
                                            </p>
                                        </div>

                                    </div>

                                    <div className="flex gap-2 shrink-0">

                                        <button
                                            onClick={() =>
                                                handleAccept(request._id)
                                            }
                                            disabled={processingId === request._id}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                                        >
                                            Accept
                                        </button>

                                        <button
                                            onClick={() =>
                                                handleReject(request._id)
                                            }
                                            disabled={processingId === request._id}
                                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-semibold disabled:opacity-50"
                                        >
                                            Reject
                                        </button>

                                    </div>

                                </div>
                            );
                        })}

                    </div>
                )}

            </div>

        </div>
    );
};

export default FriendRequestsPage;