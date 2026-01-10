import mongoose from "mongoose";

const gdParticipantSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String, required: true },
        joinedAt: { type: Date, default: Date.now },
        lastSeenAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const gdRoomSchema = new mongoose.Schema(
    {
        roomId: { type: String, required: true, unique: true, index: true },
        roomName: { type: String, required: true },
        topic: { type: String, default: "" },
        mode: { type: String, enum: ["custom", "global", "tournament"], default: "custom" },
        maxParticipants: { type: Number, default: 5 },
        durationSeconds: { type: Number, default: 600 },
        prepStartedAt: { type: Date },
        prepSeconds: { type: Number, default: 60 },
        countdownStartedAt: { type: Date },
        countdownSeconds: { type: Number, default: 10 },
        hostUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        status: { type: String, enum: ["waiting", "active", "completed"], default: "waiting" },
        startedAt: { type: Date },
        endedAt: { type: Date },
        participants: { type: [gdParticipantSchema], default: [] },
        // Per-utterance transcript entries captured during the GD session
        transcript: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
                name: { type: String, required: true },
                text: { type: String, required: true },
                createdAt: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);

const GdRoom = mongoose.model("GdRoom", gdRoomSchema);
export default GdRoom;
