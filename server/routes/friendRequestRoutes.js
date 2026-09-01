import express from "express";

import {sendFriendRequest,getReceivedRequests,acceptFriendRequest,rejectFriendRequest,getSentRequests} from "../controllers/friendRequestController.js";

import {protect} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/",protect,sendFriendRequest);

router.get("/received",protect,getReceivedRequests);

router.get("/sent", protect, getSentRequests);

router.post("/:requestId/accept",protect,acceptFriendRequest);

router.post("/:requestId/reject",protect,rejectFriendRequest);

export default router;