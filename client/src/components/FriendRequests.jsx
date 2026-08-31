import { useEffect, useState } from "react";
import axios from "axios";

const FriendRequests = ({ onConversationCreated }) => {

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem("token");

    const fetchRequests = async () => {
        try {
            const response = await axios.get(
                "http://localhost:5001/api/friend-requests/received",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setRequests(
                response.data.requests || []
            );
        } catch (error) {
            console.error(
                "Fetch Requests Error:",
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
            const response = await axios.post(
                `http://localhost:5001/api/friend-requests/${requestId}/accept`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const conversation =
                response.data.conversation;

            setRequests((prev) =>
                prev.filter(
                    (request) =>
                        request._id !== requestId
                )
            );

            if (onConversationCreated) {
                onConversationCreated(
                    conversation
                );
            }
        } catch (error) {
            console.error(
                "Accept Request Error:",
                error.response?.data || error.message
            );
        }
    };

    const handleReject = async (requestId) => {
        try {
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
                prev.filter(
                    (request) =>
                        request._id !== requestId
                )
            );
        } catch (error) {
            console.error(
                "Reject Request Error:",
                error.response?.data || error.message
            );
        }
    };

    if (loading) {
        return (
            <p className="p-4 text-gray-500">
                Loading requests...
            </p>
        );
    }

    return (
        <div className="border-b">

            <div className="px-4 py-3">
                <h3 className="font-semibold text-gray-800">
                    Friend Requests
                </h3>
            </div>

            {requests.length === 0 ? (
                <p className="px-4 pb-4 text-sm text-gray-400">
                    No pending requests
                </p>
            ) : (
                requests.map((request) => (

                    <div
                        key={request._id}
                        className="px-4 py-3 border-t flex items-center justify-between"
                    >

                        <div>
                            <p className="font-medium">
                                {request.sender?.name}
                            </p>

                            <p className="text-xs text-gray-500">
                                {request.sender?.email}
                            </p>
                        </div>

                        <div className="flex gap-2">

                            <button
                                onClick={() =>
                                    handleAccept(
                                        request._id
                                    )
                                }
                                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                            >
                                Accept
                            </button>

                            <button
                                onClick={() =>
                                    handleReject(
                                        request._id
                                    )
                                }
                                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300"
                            >
                                Reject
                            </button>

                        </div>

                    </div>
                ))
            )}

        </div>
    );
};

export default FriendRequests;