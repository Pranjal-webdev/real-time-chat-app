import express from "express";
import { sendMessage,getMessages,deleteMessage,editMessage,reactToMessage } from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/", protect, sendMessage);

router.post("/upload",protect,upload.single("file"),uploadMessage);

router.get("/:conversationId", protect, getMessages);

router.put("/:messageId", protect, editMessage);

router.put("/:messageId/reaction",protect,reactToMessage);

router.delete("/:messageId", protect, deleteMessage);


export default router;