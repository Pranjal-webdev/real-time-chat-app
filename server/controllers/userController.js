import User from "../models/User.js";

export const searchUsers = async (req, res) => {
    try {
        const { search } = req.query;

        if (!search) {
            return res.status(200).json({
                success: true,
                users: [],
            });
        }

        const users = await User.find({
            _id: { $ne: req.user._id },
            $or: [
                {
                    name: {
                        $regex: search,
                        $options: "i",
                    },
                },
                {
                    email: {
                        $regex: search,
                        $options: "i",
                    },
                },
            ],
        }).select("_id name email profileImage");

        res.status(200).json({
            success: true,
            users,
        });
    } catch (error) {
        console.error("Search Users Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};