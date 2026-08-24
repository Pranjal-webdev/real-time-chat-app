import express from "express";
import { sendMessage,getMessages,deleteMessage,editMessage } from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, sendMessage);

router.get("/:conversationId", protect, getMessages);

router.put("/:messageId", protect, editMessage);

router.delete("/:messageId", protect, deleteMessage);


export default router;