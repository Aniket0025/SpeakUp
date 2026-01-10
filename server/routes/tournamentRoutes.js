import crypto from "crypto";
import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import Tournament from "../schema/Tournament.js";

const router = Router();

const pickTournamentId = () => crypto.randomBytes(4).toString("hex").toUpperCase();

const normId = (v) => String(v || "").trim().toUpperCase();

const isWithinWindow = (now, start, end) => {
    if (start && now < start) return false;
    if (end && now > end) return false;
    return true;
};

const computeLeaderboard = (t) => {
    const totals = new Map();
    for (const g of t.groups || []) {
        for (const p of g.participants || []) {
            const uid = String(p.user);
            const prev = totals.get(uid) || { userId: uid, name: p.name, total: 0 };
            const add = Number(p?.score?.total || 0);
            totals.set(uid, { ...prev, total: Number(prev.total || 0) + add });
        }
    }
    const arr = Array.from(totals.values());
    arr.sort((a, b) => Number(b.total || 0) - Number(a.total || 0));
    return arr;
};

router.get("/", authenticate, async (req, res) => {
    try {
        const status = String(req.query.status || "").trim();
        const filter = { $or: [{ visibility: "public" }, { createdBy: req.user._id }] };
        if (status) filter.status = status;

        const list = await Tournament.find(filter)
            .select(
                "tournamentId name description organization visibility status mode registrationStartDate registrationEndDate tournamentStartDate numberOfRounds roundDurationSeconds maxParticipants groupSize language topicType createdBy participants createdAt"
            )
            .sort({ createdAt: -1 })
            .lean();

        const uid = String(req.user._id);
        const items = list.map((t) => ({
            tournamentId: t.tournamentId,
            name: t.name,
            description: t.description,
            organization: t.organization,
            visibility: t.visibility,
            status: t.status,
            mode: t.mode,
            groupSize: t.groupSize,
            startDate: t.tournamentStartDate,
            registrationStartDate: t.registrationStartDate,
            registrationEndDate: t.registrationEndDate,
            maxParticipants: Number(t.maxParticipants || 0),
            language: t.language,
            topicType: t.topicType,
            participantsCount: Array.isArray(t.participants) ? t.participants.length : 0,
            isOrganizer: String(t.createdBy) === uid,
            isRegistered: Array.isArray(t.participants) ? t.participants.some((p) => String(p.user) === uid) : false,
        }));

        return res.status(200).json({ tournaments: items });
    } catch (err) {
        return res.status(500).json({ message: err?.message || "Failed to list tournaments" });
    }
});

router.get("/search", authenticate, async (req, res) => {
    try {
        const tournamentId = normId(req.query.tournamentId);
        if (!tournamentId) return res.status(400).json({ message: "Missing tournamentId" });

        const t = await Tournament.findOne({ tournamentId })
            .select(
                "tournamentId name description organization visibility status mode registrationStartDate registrationEndDate tournamentStartDate numberOfRounds roundDurationSeconds maxParticipants groupSize language topicType createdBy participants createdAt"
            )
            .lean();
        if (!t) return res.status(404).json({ message: "Tournament not found" });

        const uid = String(req.user._id);
        const item = {
            tournamentId: t.tournamentId,
            name: t.name,
            description: t.description,
            organization: t.organization,
            visibility: t.visibility,
            status: t.status,
            mode: t.mode,
            groupSize: t.groupSize,
            startDate: t.tournamentStartDate,
            registrationStartDate: t.registrationStartDate,
            registrationEndDate: t.registrationEndDate,
            maxParticipants: Number(t.maxParticipants || 0),
            language: t.language,
            topicType: t.topicType,
            participantsCount: Array.isArray(t.participants) ? t.participants.length : 0,
            isOrganizer: String(t.createdBy) === uid,
            isRegistered: Array.isArray(t.participants) ? t.participants.some((p) => String(p.user) === uid) : false,
        };

        return res.status(200).json({ tournament: item });
    } catch (err) {
        return res.status(500).json({ message: err?.message || "Failed to search tournament" });
    }
});

router.post("/", authenticate, async (req, res) => {
    try {
        const name = String(req.body?.name || "").trim();
        const description = String(req.body?.description || "").trim();
        const organization = String(req.body?.organization || "").trim();
        const visibility = String(req.body?.visibility || "public").trim();
        const joinPassword = String(req.body?.joinPassword || "");

        const registrationStartDate = req.body?.registrationStartDate ? new Date(req.body.registrationStartDate) : undefined;
        const registrationEndDate = req.body?.registrationEndDate ? new Date(req.body.registrationEndDate) : undefined;
        const tournamentStartDate = req.body?.tournamentStartDate ? new Date(req.body.tournamentStartDate) : undefined;
        const tournamentEndDate = req.body?.tournamentEndDate ? new Date(req.body.tournamentEndDate) : undefined;

        const numberOfRounds = Math.max(1, Number(req.body?.numberOfRounds || 1));
        const roundDurationSeconds = Math.max(60, Number(req.body?.roundDurationSeconds || 600));
        const maxParticipants = Math.max(0, Number(req.body?.maxParticipants || 0));
        const groupSize = Math.max(2, Math.min(10, Number(req.body?.groupSize || 5)));

        const language = String(req.body?.language || "English").trim() || "English";
        const topicType = String(req.body?.topicType || "Mixed").trim() || "Mixed";
        const topicName = String(req.body?.topicName || "");
        const mode = String(req.body?.mode || "Online GD").trim() || "Online GD";

        const roundFormat = String(req.body?.roundFormat || "Knockout").trim() || "Knockout";
        const advancementCriteria = String(req.body?.advancementCriteria || "Top 2").trim() || "Top 2";
        const tieBreakingRules = String(req.body?.tieBreakingRules || "Judge decision").trim() || "Judge decision";
        const moderationType = String(req.body?.moderationType || "Hybrid").trim() || "Hybrid";

        const rewards = req.body?.rewards && typeof req.body.rewards === "object" ? req.body.rewards : {};
        const privacy = req.body?.privacy && typeof req.body.privacy === "object" ? req.body.privacy : {};
        const scoringCriteria = req.body?.scoringCriteria && typeof req.body.scoringCriteria === "object" ? req.body.scoringCriteria : {};
        const rules = req.body?.rules && typeof req.body.rules === "object" ? req.body.rules : {};

        const eligibilityCriteria = String(req.body?.eligibilityCriteria || "");

        if (!name) return res.status(400).json({ message: "Name is required" });
        if (visibility === "private" && !joinPassword.trim()) {
            return res.status(400).json({ message: "Organizer password is required for private tournament" });
        }

        let tournamentId = pickTournamentId();
        for (let i = 0; i < 5; i++) {
            // eslint-disable-next-line no-await-in-loop
            const exists = await Tournament.exists({ tournamentId });
            if (!exists) break;
            tournamentId = pickTournamentId();
        }

        const doc = new Tournament({
            tournamentId,
            name,
            description,
            organization,
            visibility: visibility === "private" ? "private" : "public",
            status: "registering",
            mode,
            registrationStartDate,
            registrationEndDate,
            tournamentStartDate,
            tournamentEndDate,
            numberOfRounds,
            roundDurationSeconds,
            eligibilityCriteria,
            maxParticipants,
            groupSize,
            language,
            topicType,
            topicName: String(topicName || ""),
            rules: {
                speakingRules: String(rules?.speakingRules || ""),
                timeLimits: String(rules?.timeLimits || ""),
                codeOfConduct: String(rules?.codeOfConduct || ""),
                disqualificationConditions: String(rules?.disqualificationConditions || ""),
            },
            scoringCriteria: {
                clarity: Boolean(scoringCriteria?.clarity ?? true),
                confidence: Boolean(scoringCriteria?.confidence ?? true),
                participation: Boolean(scoringCriteria?.participation ?? true),
                relevance: Boolean(scoringCriteria?.relevance ?? true),
                listening: Boolean(scoringCriteria?.listening ?? true),
                aiAssistedEvaluation: Boolean(scoringCriteria?.aiAssistedEvaluation ?? true),
            },
            roundFormat,
            advancementCriteria,
            tieBreakingRules,
            moderationType,
            rewards: {
                certificatesParticipation: Boolean(rewards?.certificatesParticipation ?? true),
                certificatesWinner: Boolean(rewards?.certificatesWinner ?? true),
                badgesXp: Boolean(rewards?.badgesXp ?? true),
                leaderboardRanking: Boolean(rewards?.leaderboardRanking ?? true),
                prizes: String(rewards?.prizes || ""),
            },
            privacy: {
                anonymizedEvaluation: Boolean(privacy?.anonymizedEvaluation ?? false),
                recordingPermission: Boolean(privacy?.recordingPermission ?? false),
                aiExplainabilityEnabled: Boolean(privacy?.aiExplainabilityEnabled ?? true),
                antiDominanceChecks: Boolean(privacy?.antiDominanceChecks ?? true),
            },
            createdBy: req.user._id,
        });

        if (joinPassword.trim()) {
            await doc.setJoinPassword(joinPassword);
        }
        await doc.save();

        const io = req.app.get("io");
        try {
            io?.to("tournaments").emit("tournaments:update", { action: "created", tournamentId: doc.tournamentId });
        } catch { }

        return res.status(201).json({ tournamentId: doc.tournamentId });
    } catch (err) {
        return res.status(500).json({ message: err?.message || "Failed to create tournament" });
    }
});

router.get("/:tournamentId", authenticate, async (req, res) => {
    try {
        const id = normId(req.params.tournamentId);
        const t = await Tournament.findOne({ tournamentId: id })
            .select(
                "tournamentId name description organization visibility status mode registrationStartDate registrationEndDate tournamentStartDate tournamentEndDate numberOfRounds roundDurationSeconds eligibilityCriteria maxParticipants groupSize language topicType topicName rules scoringCriteria roundFormat advancementCriteria tieBreakingRules moderationType rewards privacy createdBy participants groups createdAt"
            )
            .lean();
        if (!t) return res.status(404).json({ message: "Tournament not found" });

        const uid = String(req.user._id);
        const isOrganizer = String(t.createdBy) === uid;
        const me = Array.isArray(t.participants) ? t.participants.find((p) => String(p.user) === uid) : null;

        return res.status(200).json({
            tournament: {
                tournamentId: t.tournamentId,
                name: t.name,
                description: t.description,
                organization: t.organization,
                visibility: t.visibility,
                status: t.status,
                mode: t.mode,
                groupSize: t.groupSize,
                registrationStartDate: t.registrationStartDate,
                registrationEndDate: t.registrationEndDate,
                tournamentStartDate: t.tournamentStartDate,
                tournamentEndDate: t.tournamentEndDate,
                numberOfRounds: t.numberOfRounds,
                roundDurationSeconds: t.roundDurationSeconds,
                eligibilityCriteria: t.eligibilityCriteria,
                maxParticipants: Number(t.maxParticipants || 0),
                language: t.language,
                topicType: t.topicType,
                topicName: t.topicName,
                rules: t.rules,
                scoringCriteria: t.scoringCriteria,
                roundFormat: t.roundFormat,
                advancementCriteria: t.advancementCriteria,
                tieBreakingRules: t.tieBreakingRules,
                moderationType: t.moderationType,
                rewards: t.rewards,
                privacy: t.privacy,
                createdByUserId: String(t.createdBy),
                isOrganizer,
                myJoinCode: me?.joinCode || null,
                participants: (t.participants || []).map((p) => ({
                    userId: String(p.user),
                    name: p.name,
                    registeredAt: p.registeredAt,
                })),
                groups: isOrganizer
                    ? (t.groups || []).map((g) => ({
                        groupId: g.groupId,
                        roundNumber: g.roundNumber,
                        topic: g.topic,
                        judgeUserId: g.judgeUserId ? String(g.judgeUserId) : null,
                        participants: (g.participants || []).map((p) => ({
                            userId: String(p.user),
                            name: p.name,
                            score: p.score || {},
                        })),
                    }))
                    : [],
            },
        });
    } catch (err) {
        return res.status(500).json({ message: err?.message || "Failed to fetch tournament" });
    }
});

router.post("/:tournamentId/register", authenticate, async (req, res) => {
    try {
        const id = normId(req.params.tournamentId);
        const organizerPassword = String(req.body?.organizerPassword || "");

        const t = await Tournament.findOne({ tournamentId: id }).select(
            "_id tournamentId visibility status registrationStartDate registrationEndDate maxParticipants joinPasswordHash participants createdBy"
        );
        if (!t) return res.status(404).json({ message: "Tournament not found" });
        if (t.status === "completed") return res.status(400).json({ message: "Tournament ended" });
        if (t.status !== "registering") return res.status(400).json({ message: "Registration is closed" });

        const now = new Date();
        if (!isWithinWindow(now, t.registrationStartDate, t.registrationEndDate)) {
            return res.status(400).json({ message: "Registration window is closed" });
        }

        if (t.visibility === "private") {
            const ok = await t.compareJoinPassword(organizerPassword);
            if (!ok) return res.status(400).json({ message: "Invalid organizer password" });
        }

        const uid = String(req.user._id);
        const maxP = Number(t.maxParticipants || 0);
        if (maxP > 0 && Array.isArray(t.participants) && t.participants.length >= maxP) {
            const already = t.participants.some((p) => String(p.user) === uid);
            if (!already) return res.status(400).json({ message: "Tournament is full" });
        }

        let existing = (t.participants || []).find((p) => String(p.user) === uid);
        if (!existing) {
            existing = { user: req.user._id, name: req.user.fullName, registeredAt: new Date(), joinCode: "", joinCodeIssuedAt: null };
            t.participants.push(existing);
        }

        if (!existing.joinCode) {
            existing.joinCode = crypto.randomBytes(3).toString("hex").toUpperCase();
            existing.joinCodeIssuedAt = new Date();
        }

        await t.save();

        const io = req.app.get("io");
        try {
            io?.to("tournaments").emit("tournaments:update", { action: "updated", tournamentId: id });
            io?.to(`tournament:${id}`).emit("tournament:update", { action: "participants", tournamentId: id });
        } catch { }

        return res.status(200).json({ ok: true, joinCode: existing.joinCode });
    } catch (err) {
        return res.status(500).json({ message: err?.message || "Failed to register" });
    }
});

router.post("/:tournamentId/join", authenticate, async (req, res) => {
    try {
        const id = normId(req.params.tournamentId);
        const joinCode = String(req.body?.joinCode || "").trim().toUpperCase();

        const t = await Tournament.findOne({ tournamentId: id }).select("_id status tournamentStartDate participants");
        if (!t) return res.status(404).json({ message: "Tournament not found" });
        if (t.status !== "ongoing") return res.status(400).json({ message: "Tournament is not live" });

        const start = t.tournamentStartDate ? new Date(t.tournamentStartDate) : null;
        if (start && new Date() < start) return res.status(400).json({ message: "Tournament has not started yet" });

        const uid = String(req.user._id);
        const p = (t.participants || []).find((x) => String(x.user) === uid);
        if (!p) return res.status(400).json({ message: "You are not registered" });
        if (!p.joinCode) return res.status(400).json({ message: "Join code not issued" });
        if (!joinCode) return res.status(400).json({ message: "Join code is required" });
        if (String(p.joinCode || "").toUpperCase() !== joinCode) return res.status(400).json({ message: "Invalid join code" });

        return res.status(200).json({ ok: true });
    } catch (err) {
        return res.status(500).json({ message: err?.message || "Failed to join" });
    }
});

router.patch("/:tournamentId/status", authenticate, async (req, res) => {
    try {
        const id = normId(req.params.tournamentId);
        const status = String(req.body?.status || "").trim();
        if (!status) return res.status(400).json({ message: "Missing status" });
        if (!['registering', 'ongoing', 'completed'].includes(status)) return res.status(400).json({ message: "Invalid status" });

        const t = await Tournament.findOne({ tournamentId: id }).select("_id createdBy status tournamentStartDate");
        if (!t) return res.status(404).json({ message: "Tournament not found" });
        if (String(t.createdBy) !== String(req.user._id)) return res.status(403).json({ message: "Forbidden" });

        t.status = status;
        if (status === "ongoing" && !t.tournamentStartDate) t.tournamentStartDate = new Date();
        await t.save();

        const io = req.app.get("io");
        try {
            io?.to("tournaments").emit("tournaments:update", { action: "updated", tournamentId: id });
            io?.to(`tournament:${id}`).emit("tournament:update", { action: "status", tournamentId: id });
        } catch { }

        return res.status(200).json({ ok: true });
    } catch (err) {
        return res.status(500).json({ message: err?.message || "Failed to update status" });
    }
});

router.post("/:tournamentId/groups/generate", authenticate, async (req, res) => {
    try {
        const id = normId(req.params.tournamentId);
        const roundNumber = Math.max(1, Number(req.body?.roundNumber || 1));

        const t = await Tournament.findOne({ tournamentId: id }).select("_id createdBy groupSize participants groups");
        if (!t) return res.status(404).json({ message: "Tournament not found" });
        if (String(t.createdBy) !== String(req.user._id)) return res.status(403).json({ message: "Forbidden" });

        const size = Math.max(2, Math.min(10, Number(t.groupSize || 5)));
        const participants = Array.isArray(t.participants) ? [...t.participants] : [];
        for (let i = participants.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = participants[i];
            participants[i] = participants[j];
            participants[j] = tmp;
        }

        const groups = [];
        let idx = 0;
        let gnum = 1;
        while (idx < participants.length) {
            const chunk = participants.slice(idx, idx + size);
            idx += size;
            const groupId = `R${roundNumber}-G${gnum}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
            gnum += 1;
            groups.push({
                groupId,
                roundNumber,
                topic: "",
                judgeUserId: null,
                participants: chunk.map((p) => ({ user: p.user, name: p.name, score: { total: 0 } })),
                createdAt: new Date(),
            });
        }

        t.groups = Array.isArray(t.groups) ? t.groups.filter((g) => Number(g.roundNumber) !== roundNumber) : [];
        t.groups.push(...groups);
        await t.save();

        const io = req.app.get("io");
        try {
            io?.to(`tournament:${id}`).emit("tournament:update", { action: "groups", tournamentId: id });
        } catch { }

        return res.status(200).json({ ok: true, groupsCount: groups.length });
    } catch (err) {
        return res.status(500).json({ message: err?.message || "Failed to generate groups" });
    }
});

router.patch("/:tournamentId/groups/:groupId", authenticate, async (req, res) => {
    try {
        const id = normId(req.params.tournamentId);
        const groupId = String(req.params.groupId || "").trim();
        const topic = typeof req.body?.topic === "string" ? String(req.body.topic) : undefined;
        const judgeUserId = req.body?.judgeUserId ? String(req.body.judgeUserId) : undefined;

        const t = await Tournament.findOne({ tournamentId: id }).select("_id createdBy groups");
        if (!t) return res.status(404).json({ message: "Tournament not found" });
        if (String(t.createdBy) !== String(req.user._id)) return res.status(403).json({ message: "Forbidden" });

        const g = (t.groups || []).find((x) => String(x.groupId) === groupId);
        if (!g) return res.status(404).json({ message: "Group not found" });

        if (typeof topic === "string") g.topic = topic;
        if (typeof judgeUserId === "string") g.judgeUserId = judgeUserId || null;
        await t.save();

        const io = req.app.get("io");
        try {
            io?.to(`tournament:${id}`).emit("tournament:update", { action: "groups", tournamentId: id });
        } catch { }

        return res.status(200).json({ ok: true });
    } catch (err) {
        return res.status(500).json({ message: err?.message || "Failed to update group" });
    }
});

router.post("/:tournamentId/groups/:groupId/score", authenticate, async (req, res) => {
    try {
        const id = normId(req.params.tournamentId);
        const groupId = String(req.params.groupId || "").trim();
        const userId = String(req.body?.userId || "").trim();

        const clarity = Number(req.body?.clarity || 0);
        const confidence = Number(req.body?.confidence || 0);
        const participation = Number(req.body?.participation || 0);
        const relevance = Number(req.body?.relevance || 0);
        const listening = Number(req.body?.listening || 0);

        const t = await Tournament.findOne({ tournamentId: id }).select("_id createdBy groups");
        if (!t) return res.status(404).json({ message: "Tournament not found" });

        const g = (t.groups || []).find((x) => String(x.groupId) === groupId);
        if (!g) return res.status(404).json({ message: "Group not found" });

        const isOrganizer = String(t.createdBy) === String(req.user._id);
        const isJudge = g.judgeUserId && String(g.judgeUserId) === String(req.user._id);
        if (!isOrganizer && !isJudge) return res.status(403).json({ message: "Forbidden" });

        const p = (g.participants || []).find((x) => String(x.user) === String(userId));
        if (!p) return res.status(404).json({ message: "Participant not found" });

        const total = clarity + confidence + participation + relevance + listening;
        p.score = {
            clarity,
            confidence,
            participation,
            relevance,
            listening,
            total,
            scoredBy: req.user._id,
            createdAt: new Date(),
        };

        await t.save();

        const io = req.app.get("io");
        try {
            io?.to(`tournament:${id}`).emit("tournament:update", { action: "scores", tournamentId: id });
        } catch { }

        return res.status(200).json({ ok: true });
    } catch (err) {
        return res.status(500).json({ message: err?.message || "Failed to submit score" });
    }
});

router.get("/:tournamentId/leaderboard", authenticate, async (req, res) => {
    try {
        const id = normId(req.params.tournamentId);
        const t = await Tournament.findOne({ tournamentId: id }).select("_id tournamentId groups").lean();
        if (!t) return res.status(404).json({ message: "Tournament not found" });
        const leaderboard = computeLeaderboard(t);
        return res.status(200).json({ tournamentId: id, leaderboard });
    } catch (err) {
        return res.status(500).json({ message: err?.message || "Failed to load leaderboard" });
    }
});

router.get("/:tournamentId/my-group", authenticate, async (req, res) => {
    try {
        const id = normId(req.params.tournamentId);
        const t = await Tournament.findOne({ tournamentId: id }).select("_id tournamentId status groups").lean();
        if (!t) return res.status(404).json({ message: "Tournament not found" });

        const uid = String(req.user._id);
        const groups = (t.groups || [])
            .filter((g) => (g.participants || []).some((p) => String(p.user) === uid))
            .map((g) => ({
                groupId: g.groupId,
                roundNumber: g.roundNumber,
                topic: g.topic,
                judgeUserId: g.judgeUserId ? String(g.judgeUserId) : null,
                participants: (g.participants || []).map((p) => ({
                    userId: String(p.user),
                    name: p.name,
                    score: p.score || {},
                })),
            }));

        return res.status(200).json({ tournamentId: id, status: t.status, groups });
    } catch (err) {
        return res.status(500).json({ message: err?.message || "Failed to fetch group" });
    }
});

export default router;
