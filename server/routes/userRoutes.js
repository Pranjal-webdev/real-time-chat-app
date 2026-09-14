import express from "express";
import { searchUsers,updateProfileImage } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/search", protect, searchUsers);
router.put("/profile-image",protect,upload.single("profileImage"),updateProfileImage)

export default router;