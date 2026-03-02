import { Router } from "express";
import passport from "passport";
import { buildAuthPayload, login, loginWithGoogle, me, registerCustomer } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

const getClientRedirectBase = () => process.env.CLIENT_URL || "http://localhost:5173";
const isGoogleConfigured = () =>
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

const encodeAuthPayload = (payload) => Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");

router.post("/register", registerCustomer);
router.post("/login", login);
router.post("/google", loginWithGoogle);
router.get("/google", (req, res, next) => {
  if (!isGoogleConfigured()) {
    console.error("Google OAuth failure: missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
    return res.redirect(`${getClientRedirectBase()}/customer-auth?google=not_configured`);
  }

  return passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })(req, res, next);
});
router.get(
  "/google/callback",
  (req, res, next) => {
    if (!isGoogleConfigured()) {
      console.error("Google OAuth callback failure: strategy is not configured");
      return res.redirect(`${getClientRedirectBase()}/customer-auth?google=not_configured`);
    }

    return passport.authenticate("google", {
      failureRedirect: `${getClientRedirectBase()}/customer-auth?google=failed`,
      session: false,
    })(req, res, next);
  },
  (req, res) => {
    try {
      const payload = buildAuthPayload(req.user);
      const encoded = encodeAuthPayload(payload);
      const redirectUrl = `${getClientRedirectBase()}/customer-auth?google=success&auth=${encodeURIComponent(encoded)}`;
      return res.redirect(redirectUrl);
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      return res.redirect(`${getClientRedirectBase()}/customer-auth?google=failed`);
    }
  }
);
router.get("/me", protect, me);

export default router;
