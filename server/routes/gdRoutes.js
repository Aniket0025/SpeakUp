import crypto from "crypto";
import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import GdRoom from "../schema/GdRoom.js";

const router = Router();

const pickRoomId = () => crypto.randomBytes(3).toString("hex").toUpperCase();

router.post("/rooms", authenticate, async (req, res) => {
    try {
        const roomName = String(req.body?.roomName || "Custom GD Room").trim();
        const topic = String(req.body?.topic || "").trim();
        const maxParticipants = Math.max(2, Math.min(10, Number(req.body?.maxParticipants || 5)));
        const durationSeconds = Math.max(60, Number(req.body?.durationSeconds || 600));

        let roomId = pickRoomId();
        for (let i = 0; i < 5; i++) {
            // eslint-disable-next-line no-await-in-loop
            const exists = await GdRoom.exists({ roomId });
            if (!exists) break;
            roomId = pickRoomId();
        }

        const doc = await GdRoom.create({
            roomId,
            roomName,
            topic,
            maxParticipants,
            durationSeconds,
            hostUserId: req.user._id,
            status: "waiting",
            participants: [
                {
                    user: req.user._id,
                    name: req.user.fullName,
                    joinedAt: new Date(),
                    lastSeenAt: new Date(),
                },
            ],
        });

        return res.status(201).json({
            roomId: doc.roomId,
        });
    } catch (err) {
        return res.status(500).json({ message: err?.message || "Failed to create room" });
    }
});

router.post("/rooms/:roomId/join", authenticate, async (req, res) => {
    try {
        const roomId = String(req.params.roomId || "").trim().toUpperCase();
        const room = await GdRoom.findOne({ roomId });
        if (!room) return res.status(404).json({ message: "Room not found" });
        if (room.status === "completed") return res.status(400).json({ message: "Room ended" });

        const uid = String(req.user._id);
        const existing = room.participants.find((p) => String(p.user) === uid);
        if (!existing) {
            if (room.participants.length >= room.maxParticipants) {
                return res.status(400).json({ message: "Room is full" });
            }
            room.participants.push({
                user: req.user._id,
                name: req.user.fullName,
                joinedAt: new Date(),
                lastSeenAt: new Date(),
            });
        } else {
            existing.lastSeenAt = new Date();
        }

        await room.save();
        return res.status(200).json({ ok: true });
    } catch (err) {
        return res.status(500).json({ message: err?.message || "Failed to join room" });
    }
});

router.get("/rooms/:roomId", authenticate, async (req, res) => {
    try {
        const roomId = String(req.params.roomId || "").trim().toUpperCase();
        const room = await GdRoom.findOne({ roomId }).lean();
        if (!room) return res.status(404).json({ message: "Room not found" });

        const startedAt = room.startedAt ? new Date(room.startedAt).getTime() : null;
        const durationSeconds = Number(room.durationSeconds || 0);
        const remainingSeconds = startedAt ? Math.max(0, durationSeconds - Math.floor((Date.now() - startedAt) / 1000)) : durationSeconds;

        return res.status(200).json({ room, remainingSeconds });
    } catch (err) {
        return res.status(500).json({ message: err?.message || "Failed to fetch room" });
    }
});

router.post("/global/join", authenticate, async (req, res) => {
    try {
        const uid = req.user._id;

        // If user is already in a waiting global room, return it
        const existing = await GdRoom.findOne({
            mode: "global",
            status: "waiting",
            participants: { $elemMatch: { user: uid } },
        }).select("roomId");
        if (existing) return res.status(200).json({ roomId: existing.roomId });

        // Find an available waiting room with < 6 participants
        // participants.5 exists means 6th element exists => room is full
        const available = await GdRoom.findOne({
            mode: "global",
            status: "waiting",
            participants: { $not: { $elemMatch: { user: uid } } },
            "participants.5": { $exists: false },
        })
            .sort({ createdAt: 1 })
            .select("roomId maxParticipants");

        if (available) {
            await GdRoom.updateOne(
                { roomId: available.roomId, participants: { $not: { $elemMatch: { user: uid } } } },
                {
                    $push: {
                        participants: { user: uid, name: req.user.fullName, joinedAt: new Date(), lastSeenAt: new Date() },
                    },
                }
            );
            return res.status(200).json({ roomId: available.roomId });
        }

        // Create new global waiting room
        let roomId = pickRoomId();
        for (let i = 0; i < 5; i++) {
            // eslint-disable-next-line no-await-in-loop
            const exists = await GdRoom.exists({ roomId });
            if (!exists) break;
            roomId = pickRoomId();
        }

        const doc = await GdRoom.create({
            roomId,
            roomName: "Global Match",
            topic: "Global Discussion",
            mode: "global",
            maxParticipants: 6,
            durationSeconds: 10 * 60,
            countdownSeconds: 10,
            hostUserId: uid,
            status: "waiting",
            participants: [
                {
                    user: uid,
                    name: req.user.fullName,
                    joinedAt: new Date(),
                    lastSeenAt: new Date(),
                },
            ],
        });

        return res.status(201).json({ roomId: doc.roomId });
    } catch (err) {
        return res.status(500).json({ message: err?.message || "Failed to join global match" });
    }
});

router.get("/rooms", authenticate, async (req, res) => {
    try {
        const status = String(req.query.status || "waiting").trim();
        const mode = String(req.query.mode || "custom").trim();
        const filter = {};
        if (status) filter.status = status;
        if (mode) filter.mode = mode;

        const rooms = await GdRoom.find(filter)
            .select("roomId roomName topic maxParticipants status participants hostUserId createdAt")
            .populate({ path: "hostUserId", select: "fullName" })
            .sort({ createdAt: -1 })
            .lean();

        const data = rooms.map((r) => ({
            roomId: r.roomId,
            roomName: r.roomName,
            topic: r.topic,
            maxParticipants: r.maxParticipants,
            status: r.status,
            participantsCount: Array.isArray(r.participants) ? r.participants.length : 0,
            hostName: r.hostUserId && typeof r.hostUserId === "object" ? r.hostUserId.fullName : null,
        }));

        return res.status(200).json({ rooms: data });
    } catch (err) {
        return res.status(500).json({ message: err?.message || "Failed to list rooms" });
    }
});

export default router;
