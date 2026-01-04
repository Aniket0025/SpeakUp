import jwt from "jsonwebtoken";
import User from "../schema/User.js";

export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
        if (!token) return res.status(401).json({ message: "Unauthorized" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("_id fullName email role");
        if (!user) return res.status(401).json({ message: "Unauthorized" });

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Unauthorized" });
    }
};

export const authorizeRole = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Forbidden" });
    }
    next();
};
