import FriendRequest from "../models/FriendRequest.js";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";


export const sendFriendRequest = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        if (userId.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot send request to yourself",
            });
        }

        const receiver = await User.findById(userId);

        if (!receiver) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const existingRequest = await FriendRequest.findOne({
            $or: [
                {
                    sender: req.user._id,
                    receiver: userId,
                },
                {
                    sender: userId,
                    receiver: req.user._id,
                },
            ],
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: `Request already ${existingRequest.status}`,
            });
        }

        const request = await FriendRequest.create({
            sender: req.user._id,
            receiver: userId,
        });

        const populatedRequest =
            await FriendRequest.findById(request._id)
                .populate("sender", "name email profileImage")
                .populate("receiver", "name email profileImage");

        res.status(201).json({
            success: true,
            message: "Friend request sent",
            request: populatedRequest,
        });
    } catch (error) {
        console.error(
            "Send Friend Request Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};



export const getReceivedRequests = async (req, res) => {
    try {
        const requests = await FriendRequest.find({
            receiver: req.user._id,
            status: "pending",
        })
            .populate(
                "sender",
                "name email profileImage"
            )
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            requests,
        });
    } catch (error) {
        console.error(
            "Get Friend Requests Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};


export const acceptFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;

        const request = await FriendRequest.findOne({
            _id: requestId,
            receiver: req.user._id,
            status: "pending",
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Friend request not found",
            });
        }

        request.status = "accepted";
        await request.save();

        let conversation = await Conversation.findOne({
            participants: {
                $all: [
                    request.sender,
                    request.receiver,
                ],
            },
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [
                    request.sender,
                    request.receiver,
                ],
            });
        }

        conversation = await Conversation.findById(
            conversation._id
        ).populate(
            "participants",
            "name email profileImage"
        );

        res.status(200).json({
            success: true,
            message: "Friend request accepted",
            conversation,
        });
    } catch (error) {
        console.error(
            "Accept Friend Request Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};


export const rejectFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;

        const request = await FriendRequest.findOne({
            _id: requestId,
            receiver: req.user._id,
            status: "pending",
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Friend request not found",
            });
        }

        request.status = "rejected";
        await request.save();

        res.status(200).json({
            success: true,
            message: "Friend request rejected",
        });
    } catch (error) {
        console.error(
            "Reject Friend Request Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};