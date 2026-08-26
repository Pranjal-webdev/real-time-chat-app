import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { initializeSocket } from "./socket/socket.js"
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import path from "path";

dotenv.config();
connectDB();

const app = express();

const httpServer = createServer(app);

initializeSocket(httpServer);


app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "http://localhost:5174",
        ],
        credentials: true,
    })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/uploads",express.static(path.join(process.cwd(), "uploads")));

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Chat App Server Running",
    });
});


const PORT = process.env.PORT || 5001;

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});