import jwt from "jsonwebtoken";
import User from "../schema/User.js";

const generateToken = (user) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured on the server");
    }
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

export const signup = async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "Full Name, Email and Password are required" });
        }

        const existing = await User.findOne({ email: email.toLowerCase().trim() });
        if (existing) {
            return res.status(409).json({ message: "Email already registered" });
        }

        const user = new User({
            fullName: fullName.trim(),
            email: email.toLowerCase().trim(),
            password,
            role: role === "admin" ? "admin" : "user",
        });

        await user.save();

        const token = generateToken(user);

        return res.status(201).json({
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
            },
            token,
        });
    } catch (err) {
        console.error("Signup error:", err);
        // Duplicate key error (e.g., unique email)
        if (err?.code === 11000 && (err?.keyPattern?.email || err?.keyValue?.email)) {
            return res.status(409).json({ message: "Email already registered" });
        }
        // Mongoose validation errors
        if (err?.name === "ValidationError") {
            const firstError = Object.values(err.errors)?.[0]?.message || "Validation error";
            return res.status(400).json({ message: firstError });
        }
        // Fallback: surface actual error message for easier debugging in development
        return res.status(500).json({ message: err?.message || "Server error" });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and Password are required" });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = generateToken(user);

        return res.status(200).json({
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
            },
            token,
        });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: err?.message || "Server error" });
    }
};

export const me = (req, res) => {
    const user = req.user;
    return res.status(200).json({
        user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
        },
    });
};
