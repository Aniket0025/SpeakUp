import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import jwt from "jsonwebtoken";
import path from "path";
import { Server as SocketIOServer } from "socket.io";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import ExtemporeSession from "./schema/ExtemporeSession.js";
import User from "./schema/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

app.get("/", (req, res) => {
    res.status(200).json({ status: "ok" });
});

// HTTP server + Socket.IO setup
const server = http.createServer(app);

const io = new SocketIOServer(server, {
    cors: {
        origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

// Socket auth middleware using JWT
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token || (socket.handshake.headers?.authorization || "").replace("Bearer ", "");
        if (!token) return next(new Error("Unauthorized"));
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("_id fullName email role");
        if (!user) return next(new Error("Unauthorized"));
        socket.user = user;
        next();
    } catch (err) {
        next(new Error("Unauthorized"));
    }
});

io.on("connection", (socket) => {
    // Start a new extempore session
    socket.on("extempore:start", async (payload, cb) => {
        try {
            const { topic, category, durationSeconds } = payload || {};
            if (!topic || !category) return cb?.({ ok: false, error: "Missing topic or category" });

            const session = await ExtemporeSession.create({
                user: socket.user._id,
                topic,
                category,
                durationSeconds,
            });

            socket.join(`extempore:${session._id}`);
            cb?.({ ok: true, sessionId: String(session._id) });
        } catch (err) {
            cb?.({ ok: false, error: err.message || "Failed to start session" });
        }
    });

    // Append transcript chunk
    socket.on("extempore:chunk", async ({ sessionId, text }) => {
        try {
            if (!sessionId || !text) return;
            const update = await ExtemporeSession.findOneAndUpdate(
                { _id: sessionId, user: socket.user._id },
                [{ $set: { transcript: { $concat: ["$transcript", { $cond: [{ $eq: ["$transcript", ""] }, "", " "] }, text] } } }],
                { new: true }
            ).select("_id transcript");
            if (update) {
                io.to(`extempore:${sessionId}`).emit("extempore:update", { sessionId, transcript: update.transcript });
            }
        } catch { }
    });

    // Stop session
    socket.on("extempore:stop", async ({ sessionId, finalTranscript, durationSeconds }, cb) => {
        try {
            if (!sessionId) return cb?.({ ok: false, error: "Missing sessionId" });

            const session = await ExtemporeSession.findOne({ _id: sessionId, user: socket.user._id });
            if (!session) return cb?.({ ok: false, error: "Session not found" });

            if (finalTranscript && finalTranscript.trim()) {
                session.transcript = session.transcript ? `${session.transcript} ${finalTranscript}` : finalTranscript;
            }
            session.endedAt = new Date();
            if (durationSeconds) session.durationSeconds = durationSeconds;
            session.status = "completed";
            await session.save();

            io.to(`extempore:${sessionId}`).emit("extempore:completed", { sessionId, transcript: session.transcript });
            cb?.({ ok: true });
        } catch (err) {
            cb?.({ ok: false, error: err.message || "Failed to stop session" });
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

