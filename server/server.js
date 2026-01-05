import cors from "cors";
import crypto from "crypto";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import jwt from "jsonwebtoken";
import path from "path";
import { Server as SocketIOServer } from "socket.io";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import gdRoutes from "./routes/gdRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import zegoRoutes from "./routes/zegoRoutes.js";
import ExtemporeSession from "./schema/ExtemporeSession.js";
import GdRoom from "./schema/GdRoom.js";
import User from "./schema/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/gd", gdRoutes);
app.use("/api/user", userRoutes);
app.use("/api/zego", zegoRoutes);

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

// In-memory GD rooms (ephemeral; resets on server restart)
const gdRooms = new Map();
const gdTimers = new Map();

const gdRoomSocketName = (roomId) => `gd:${roomId}`;

const pickRoomId = () => crypto.randomBytes(3).toString("hex").toUpperCase();

const serializeRoom = (room) => {
    const participants = Array.from(room.participants.values()).map((p) => ({
        userId: p.userId,
        name: p.name,
    }));
    return {
        roomId: room.roomId,
        roomName: room.roomName,
        topic: room.topic,
        maxParticipants: room.maxParticipants,
        hostUserId: room.hostUserId,
        status: room.status,
        createdAt: room.createdAt,
        startedAt: room.startedAt,
        durationSeconds: room.durationSeconds,
        participants,
    };
};

const remainingSeconds = (room) => {
    if (!room.startedAt || !room.durationSeconds) return room.durationSeconds || 0;
    const elapsed = Math.floor((Date.now() - room.startedAt) / 1000);
    return Math.max(0, room.durationSeconds - elapsed);
};

const cleanupGdRoomIfEmpty = (roomId) => {
    const room = gdRooms.get(roomId);
    if (!room) return;
    if (room.participants.size > 0) return;
    const t = gdTimers.get(roomId);
    if (t) {
        clearInterval(t);
        gdTimers.delete(roomId);
    }
    gdRooms.delete(roomId);
};

const roomFromDb = (doc) => {
    const participants = new Map();
    for (const p of doc.participants || []) {
        const uid = String(p.user);
        participants.set(uid, { socketId: null, userId: uid, name: p.name });
    }
    return {
        roomId: doc.roomId,
        roomName: doc.roomName,
        topic: doc.topic,
        maxParticipants: doc.maxParticipants,
        hostUserId: doc.hostUserId ? String(doc.hostUserId) : null,
        status: doc.status,
        createdAt: doc.createdAt ? new Date(doc.createdAt).getTime() : Date.now(),
        startedAt: doc.startedAt ? new Date(doc.startedAt).getTime() : null,
        durationSeconds: doc.durationSeconds,
        participants,
    };
};

const hydrateGdRoom = async (roomId) => {
    const id = String(roomId || "").trim().toUpperCase();
    const existing = gdRooms.get(id);
    if (existing) return existing;
    const doc = await GdRoom.findOne({ roomId: id }).lean();
    if (!doc) return null;
    const room = roomFromDb(doc);
    gdRooms.set(id, room);
    return room;
};

const ensureTimerIfActive = (roomId, room) => {
    const id = String(roomId || "").trim().toUpperCase();
    if (!room || room.status !== "active") return;
    if (gdTimers.get(id)) return;
    const interval = setInterval(async () => {
        try {
            const r = gdRooms.get(id);
            if (!r) {
                clearInterval(interval);
                gdTimers.delete(id);
                return;
            }
            const rem = remainingSeconds(r);
            io.to(gdRoomSocketName(id)).emit("gd:timer", { roomId: id, remainingSeconds: rem });
            if (rem <= 0) {
                r.status = "completed";
                io.to(gdRoomSocketName(id)).emit("gd:ended", { roomId: id });
                io.to(gdRoomSocketName(id)).emit("gd:room", serializeRoom(r));
                clearInterval(interval);
                gdTimers.delete(id);
                await GdRoom.updateOne({ roomId: id }, { $set: { status: "completed", endedAt: new Date() } });
            }
        } catch { }
    }, 1000);
    gdTimers.set(id, interval);
};

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
    // ---- GD: Create / Join / Start with realtime timer ----
    socket.on("gd:create", async (payload, cb) => {
        try {
            const { roomName, topic, maxParticipants, durationSeconds } = payload || {};
            const roomId = pickRoomId();
            const uid = String(socket.user._id);
            const room = {
                roomId,
                roomName: String(roomName || "Custom GD Room"),
                topic: String(topic || ""),
                maxParticipants: Math.max(2, Math.min(10, Number(maxParticipants || 5))),
                hostUserId: uid,
                status: "waiting",
                createdAt: Date.now(),
                startedAt: null,
                durationSeconds: Number(durationSeconds || 600),
                participants: new Map(),
            };
            room.participants.set(uid, { socketId: socket.id, userId: uid, name: socket.user.fullName });
            gdRooms.set(roomId, room);

            await GdRoom.create({
                roomId,
                roomName: room.roomName,
                topic: room.topic,
                maxParticipants: room.maxParticipants,
                durationSeconds: room.durationSeconds,
                hostUserId: socket.user._id,
                status: "waiting",
                participants: [{ user: socket.user._id, name: socket.user.fullName, joinedAt: new Date(), lastSeenAt: new Date() }],
            });

            socket.data.gdRoomId = roomId;
            socket.join(gdRoomSocketName(roomId));

            io.to(gdRoomSocketName(roomId)).emit("gd:room", serializeRoom(room));
            cb?.({ ok: true, room: serializeRoom(room) });
        } catch (err) {
            cb?.({ ok: false, error: err.message || "Failed to create room" });
        }
    });

    socket.on("gd:join", async (payload, cb) => {
        try {
            const { roomId } = payload || {};
            const id = String(roomId || "").trim().toUpperCase();
            const room = (await hydrateGdRoom(id)) || gdRooms.get(id);
            if (!room) return cb?.({ ok: false, error: "Room not found" });
            if (room.status === "completed") return cb?.({ ok: false, error: "Room ended" });

            const uid = String(socket.user._id);
            const already = room.participants.has(uid);
            if (!already && room.participants.size >= room.maxParticipants) return cb?.({ ok: false, error: "Room is full" });
            room.participants.set(uid, { socketId: socket.id, userId: uid, name: socket.user.fullName });

            await GdRoom.updateOne(
                { roomId: id, participants: { $not: { $elemMatch: { user: socket.user._id } } } },
                { $push: { participants: { user: socket.user._id, name: socket.user.fullName, joinedAt: new Date(), lastSeenAt: new Date() } } }
            );
            await GdRoom.updateOne(
                { roomId: id, "participants.user": socket.user._id },
                { $set: { "participants.$.lastSeenAt": new Date() } }
            );

            socket.data.gdRoomId = id;
            socket.join(gdRoomSocketName(id));

            io.to(gdRoomSocketName(id)).emit("gd:room", serializeRoom(room));
            ensureTimerIfActive(id, room);
            cb?.({ ok: true, room: serializeRoom(room) });
        } catch (err) {
            cb?.({ ok: false, error: err.message || "Failed to join room" });
        }
    });

    socket.on("gd:get", async (payload, cb) => {
        try {
            const { roomId } = payload || {};
            const id = String(roomId || "").trim().toUpperCase();
            const room = (await hydrateGdRoom(id)) || gdRooms.get(id);
            if (!room) return cb?.({ ok: false, error: "Room not found" });
            ensureTimerIfActive(id, room);
            cb?.({ ok: true, room: serializeRoom(room), remainingSeconds: remainingSeconds(room) });
        } catch (err) {
            cb?.({ ok: false, error: err.message || "Failed to fetch room" });
        }
    });

    socket.on("gd:start", async (payload, cb) => {
        try {
            const { roomId } = payload || {};
            const id = String(roomId || "").trim().toUpperCase();
            const room = (await hydrateGdRoom(id)) || gdRooms.get(id);
            if (!room) return cb?.({ ok: false, error: "Room not found" });
            if (String(room.hostUserId) !== String(socket.user._id)) return cb?.({ ok: false, error: "Only host can start" });
            if (room.status !== "waiting") return cb?.({ ok: false, error: "Room already started" });

            room.status = "active";
            room.startedAt = Date.now();
            await GdRoom.updateOne({ roomId: id }, { $set: { status: "active", startedAt: new Date(room.startedAt) } });

            io.to(gdRoomSocketName(id)).emit("gd:started", {
                roomId: id,
                startedAt: room.startedAt,
                durationSeconds: room.durationSeconds,
            });
            io.to(gdRoomSocketName(id)).emit("gd:room", serializeRoom(room));

            // Start realtime timer broadcast
            const existing = gdTimers.get(id);
            if (existing) {
                clearInterval(existing);
                gdTimers.delete(id);
            }

            ensureTimerIfActive(id, room);
            cb?.({ ok: true, room: serializeRoom(room) });
        } catch (err) {
            cb?.({ ok: false, error: err.message || "Failed to start room" });
        }
    });

    socket.on("gd:leave", (payload, cb) => {
        try {
            const roomId = (payload?.roomId || socket.data.gdRoomId || "").toString().trim().toUpperCase();
            const room = gdRooms.get(roomId);
            if (!room) return cb?.({ ok: true });
            const uid = String(socket.user._id);
            const existing = room.participants.get(uid);
            if (existing?.socketId === socket.id) {
                room.participants.delete(uid);
            }
            socket.leave(gdRoomSocketName(roomId));
            socket.data.gdRoomId = null;

            // Reassign host if host left
            if (String(room.hostUserId) === String(socket.user._id)) {
                const next = Array.from(room.participants.values())[0];
                room.hostUserId = next ? next.userId : null;
            }

            if (room.participants.size === 0) {
                cleanupGdRoomIfEmpty(roomId);
            } else {
                io.to(gdRoomSocketName(roomId)).emit("gd:room", serializeRoom(room));
            }
            cb?.({ ok: true });
        } catch {
            cb?.({ ok: true });
        }
    });

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

    socket.on("disconnect", () => {
        try {
            const roomId = (socket.data.gdRoomId || "").toString().trim().toUpperCase();
            if (!roomId) return;
            const room = gdRooms.get(roomId);
            if (!room) return;
            const uid = String(socket.user._id);
            const existing = room.participants.get(uid);
            if (existing?.socketId === socket.id) {
                room.participants.delete(uid);
            }

            if (room.participants.size === 0) {
                cleanupGdRoomIfEmpty(roomId);
                return;
            }

            // Reassign host if host left
            if (String(room.hostUserId) === String(socket.user._id)) {
                const next = Array.from(room.participants.values())[0];
                room.hostUserId = next ? next.userId : room.hostUserId;
            }
            io.to(gdRoomSocketName(roomId)).emit("gd:room", serializeRoom(room));
        } catch { }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

