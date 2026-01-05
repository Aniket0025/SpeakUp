import mongoose from "mongoose";

const extemporeSessionSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        topic: { type: String, required: true },
        category: { type: String, required: true },
        transcript: { type: String, default: "" },
        startedAt: { type: Date, default: Date.now },
        endedAt: { type: Date },
        durationSeconds: { type: Number },
        status: { type: String, enum: ["active", "completed"], default: "active" },
    },
    { timestamps: true }
);

const ExtemporeSession = mongoose.model("ExtemporeSession", extemporeSessionSchema);
export default ExtemporeSession;
