import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {

    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith("Bearer")) {
            return res.status(401).json({
                success: false,
                message: "Not authorized. Token required",
            });
        }

        const token = authHeader.substring(7);

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId)
            .select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        req.user = user;

        next();

    } catch (error) {

        console.log("AUTH ERROR:", error.message);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};