import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const tournamentParticipantSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String, required: true },
        registeredAt: { type: Date, default: Date.now },
        joinCode: { type: String },
        joinCodeIssuedAt: { type: Date },
    },
    { _id: false }
);

const tournamentScoreSchema = new mongoose.Schema(
    {
        clarity: { type: Number, default: 0 },
        confidence: { type: Number, default: 0 },
        participation: { type: Number, default: 0 },
        relevance: { type: Number, default: 0 },
        listening: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
        scoredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const tournamentGroupSchema = new mongoose.Schema(
    {
        groupId: { type: String, required: true },
        roundNumber: { type: Number, default: 1 },
        topic: { type: String, default: "" },
        judgeUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        participants: {
            type: [
                {
                    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
                    name: { type: String, required: true },
                    score: { type: tournamentScoreSchema, default: () => ({}) },
                },
            ],
            default: [],
        },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const tournamentSchema = new mongoose.Schema(
    {
        tournamentId: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true },
        description: { type: String, default: "" },
        organization: { type: String, default: "" },
        visibility: { type: String, enum: ["public", "private"], default: "public" },
        status: { type: String, enum: ["registering", "ongoing", "completed"], default: "registering" },
        mode: { type: String, default: "Online GD" },

        registrationStartDate: { type: Date },
        registrationEndDate: { type: Date },
        tournamentStartDate: { type: Date },
        tournamentEndDate: { type: Date },
        numberOfRounds: { type: Number, default: 1 },
        roundDurationSeconds: { type: Number, default: 600 },

        eligibilityCriteria: { type: String, default: "" },
        maxParticipants: { type: Number, default: 0 },
        groupSize: { type: Number, default: 5 },
        language: { type: String, default: "English" },
        topicType: { type: String, default: "Mixed" },
        topicName: { type: String, default: "" },

        rules: {
            speakingRules: { type: String, default: "" },
            timeLimits: { type: String, default: "" },
            codeOfConduct: { type: String, default: "" },
            disqualificationConditions: { type: String, default: "" },
        },

        scoringCriteria: {
            clarity: { type: Boolean, default: true },
            confidence: { type: Boolean, default: true },
            participation: { type: Boolean, default: true },
            relevance: { type: Boolean, default: true },
            listening: { type: Boolean, default: true },
            aiAssistedEvaluation: { type: Boolean, default: true },
        },

        roundFormat: { type: String, default: "Knockout" },
        advancementCriteria: { type: String, default: "Top 2" },
        tieBreakingRules: { type: String, default: "Judge decision" },
        moderationType: { type: String, default: "Hybrid" },

        rewards: {
            certificatesParticipation: { type: Boolean, default: true },
            certificatesWinner: { type: Boolean, default: true },
            badgesXp: { type: Boolean, default: true },
            leaderboardRanking: { type: Boolean, default: true },
            prizes: { type: String, default: "" },
        },

        privacy: {
            anonymizedEvaluation: { type: Boolean, default: false },
            recordingPermission: { type: Boolean, default: false },
            aiExplainabilityEnabled: { type: Boolean, default: true },
            antiDominanceChecks: { type: Boolean, default: true },
        },

        joinPasswordHash: { type: String, default: "" },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        participants: { type: [tournamentParticipantSchema], default: [] },
        groups: { type: [tournamentGroupSchema], default: [] },
    },
    { timestamps: true }
);

tournamentSchema.methods.setJoinPassword = async function (plainPassword) {
    if (!plainPassword) {
        this.joinPasswordHash = "";
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.joinPasswordHash = await bcrypt.hash(String(plainPassword), salt);
};

tournamentSchema.methods.compareJoinPassword = async function (candidate) {
    if (!this.joinPasswordHash) return false;
    return bcrypt.compare(String(candidate || ""), this.joinPasswordHash);
};

const Tournament = mongoose.model("Tournament", tournamentSchema);
export default Tournament;
