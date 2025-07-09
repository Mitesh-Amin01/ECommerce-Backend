import express from "express";
import passport from "passport";
import "../config/passport.js"; // Google OAuth Strategy
import { generateTokens } from "../controllers/user.controller.js";

const router = express.Router();

// Step 1: Redirect to Google login
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], prompt: "select_account"})
);

// Step 2: Google redirects back here
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login", // Optional
    session: false,
  }),
  async (req, res) => {
    const user = req.user;

    const { accessToken, refreshToken } = await generateTokens(user._id);

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      maxAge: 10 * 24 * 60 * 60 * 1000, // 10 days
    };

    res
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .redirect("http://localhost:5173"); // Redirect to React frontend
  }
);

export default router;
