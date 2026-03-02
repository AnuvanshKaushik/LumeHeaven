import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import { upsertGoogleUserFromProfile } from "../controllers/authController.js";

const configurePassport = (passport) => {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/auth/google/callback";

  if (!clientID || !clientSecret) {
    console.warn("Google OAuth is not configured: missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile?.emails?.[0]?.value;
          const photo = profile?.photos?.[0]?.value;

          const user = await upsertGoogleUserFromProfile({
            googleId: profile?.id,
            name: profile?.displayName,
            email,
            picture: photo,
          });

          return done(null, user);
        } catch (error) {
          console.error("Google OAuth strategy error:", error);
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user || null);
    } catch (error) {
      done(error, null);
    }
  });
};

export default configurePassport;
