import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { generateToken04 } from "../utils/zegoToken.js";

const router = Router();

router.get("/token", authenticate, async (req, res) => {
    try {
        const appID = Number(process.env.ZEGO_APP_ID);
        const serverSecret = process.env.ZEGO_SERVER_SECRET;
        const roomID = String(req.query.roomID || "").trim();
        const effectiveTimeInSeconds = Number(req.query.expired_ts || 3600);

        if (!appID || !serverSecret) {
            return res.status(500).json({ message: "ZEGO env not configured" });
        }
        if (!roomID) {
            return res.status(400).json({ message: "Missing roomID" });
        }

        const userID = String(req.user?._id);
        const token = generateToken04(appID, userID, serverSecret, effectiveTimeInSeconds, "");

        return res.status(200).json({ token, appID, userID, userName: req.user?.fullName || "User" });
    } catch (err) {
        return res.status(500).json({ message: err?.message || "Failed to generate ZEGO token" });
    }
});

export default router;
