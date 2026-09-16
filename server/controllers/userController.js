import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";

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


export const updateProfileImage = async (req, res) => {

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Profile image is required",
            });
        }

        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: "chat-app/profile-images",
                    resource_type: "image",
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );

            stream.end(req.file.buffer);
        });

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { profileImage: uploadResult.secure_url },
            { new: true }
        ).select("_id name email profileImage");

        res.status(200).json({
            success: true,
            message: "Profile image updated successfully",
            user,
        });
    } catch (error) {
        console.error("Update Profile Image Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};