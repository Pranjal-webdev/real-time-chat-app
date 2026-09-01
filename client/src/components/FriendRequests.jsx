import { useEffect, useState } from "react";
import axios from "axios";

const FriendRequests = ({ onConversationCreated }) => {

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

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

            console.log(
                "Friend Request Accepted:",
                response.data
            );

            setRequests((prev) =>
                prev.filter(
                    (request) =>
                        request._id !== requestId
                )
            );

            if (response.data.conversation) {
                onConversationCreated(
                    conversation
                );
            }

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
        <div className="border-b border-gray-200">

            <div className="px-4 py-3 bg-gray-50">

                <div className="flex items-center justify-between">

                    <h3 className="font-semibold text-gray-800">
                        Friend Requests
                    </h3>

                    <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                        {requests.length}
                    </span>

                </div>

            </div>

            <div>
                {requests.map((request) => (

                    <div
                        key={request._id}
                        className="px-4 py-3 border-t flex items-center justify-between"
                    >


                        <div className="flex items-center gap-3">

                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold">
                                {request.sender?.name
                                    ?.charAt(0)
                                    .toUpperCase() || "U"}
                            </div>

                            <div className="flex-1 min-w-0">

                                <p className="font-semibold text-gray-900 truncate">
                                    {request.sender?.name ||
                                        "Unknown User"}
                                </p>

                                <p className="text-xs text-gray-500 truncate">
                                    {request.sender?.email || ""}
                                </p>

                            </div>

                        </div>

                        <div className="flex gap-2 mt-3">

                            <button
                                onClick={() =>
                                    handleAccept(request._id)
                                }
                                disabled={
                                    processingId === request._id
                                }
                                className="flex-1 bg-blue-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {processingId === request._id
                                    ? "..."
                                    : "Accept"}
                            </button>

                            <button
                                onClick={() =>
                                    handleReject(request._id)
                                }
                                disabled={
                                    processingId === request._id
                                }
                                className="flex-1 bg-gray-100 text-gray-700 text-sm font-semibold py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                            >
                                Reject
                            </button>

                        </div>

                    </div>

                ))}

            </div>

        </div>
    );   
};

export default FriendRequests;