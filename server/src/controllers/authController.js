import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const signToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

export const buildAuthPayload = (user) => ({
  token: signToken(user),
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profilePicture: user.profilePicture || "",
  },
});

const buildAuthResponse = (user, status = 200) => ({
  status,
  payload: buildAuthPayload(user),
});

export const upsertGoogleUserFromProfile = async (profile) => {
  const email = String(profile?.email || "").toLowerCase();
  if (!email) {
    throw new Error("Google profile is missing email");
  }

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: profile.name || email.split("@")[0],
      email,
      googleId: profile.googleId || profile.sub || "",
      profilePicture: profile.picture || "",
      role: "customer",
    });
    return user;
  }

  const needsSave = !user.googleId || (!user.profilePicture && profile.picture);
  if (needsSave) {
    user.googleId = user.googleId || profile.googleId || profile.sub || user.googleId;
    user.profilePicture = user.profilePicture || profile.picture || "";
    await user.save();
  }

  return user;
};

export const registerCustomer = async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "customer",
    });

    const auth = buildAuthResponse(user, 201);
    return res.status(auth.status).json(auth.payload);
  } catch (error) {
    return res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const role = String(req.body?.role || "customer").trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (!["customer", "manager"].includes(role)) {
      return res.status(400).json({ message: "Invalid role value" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.password) {
      return res.status(400).json({ message: "This account uses Google sign-in. Please continue with Google." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.role !== role) {
      return res.status(403).json({ message: "Role mismatch for this login" });
    }

    const auth = buildAuthResponse(user, 200);
    return res.status(auth.status).json(auth.payload);
  } catch (error) {
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
};

export const loginWithGoogle = async (req, res) => {
  try {
    const { credential, accessToken } = req.body;
    if (!credential && !accessToken) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    const expectedClientId = process.env.GOOGLE_CLIENT_ID;

    let profile = null;

    if (credential) {
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
      );

      if (!response.ok) {
        return res.status(401).json({ message: "Google token verification failed" });
      }

      profile = await response.json();
      if (expectedClientId && profile.aud !== expectedClientId) {
        return res.status(401).json({ message: "Invalid Google audience" });
      }
    } else {
      const [profileResponse, tokenInfoResponse] = await Promise.all([
        fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(
          `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
        ),
      ]);

      if (!profileResponse.ok || !tokenInfoResponse.ok) {
        return res.status(401).json({ message: "Google token verification failed" });
      }

      profile = await profileResponse.json();
      const tokenInfo = await tokenInfoResponse.json();
      if (expectedClientId && tokenInfo.aud !== expectedClientId) {
        return res.status(401).json({ message: "Invalid Google audience" });
      }
    }

    const isEmailVerified =
      profile.email_verified === "true" || profile.email_verified === true;
    if (!profile.email || !isEmailVerified) {
      return res.status(401).json({ message: "Google account email is not verified" });
    }

    const user = await upsertGoogleUserFromProfile(profile);

    const auth = buildAuthResponse(user, 200);
    return res.status(auth.status).json(auth.payload);
  } catch (error) {
    return res.status(500).json({ message: "Google authentication failed", error: error.message });
  }
};

export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load user", error: error.message });
  }
};

export const ensureDefaultManager = async () => {
  const managerEmail = process.env.DEFAULT_MANAGER_EMAIL;
  const managerPassword = process.env.DEFAULT_MANAGER_PASSWORD;
  const managerName = process.env.DEFAULT_MANAGER_NAME || "LUMEHEAVEN Manager";

  if (!managerEmail || !managerPassword) {
    return;
  }

  const existingManager = await User.findOne({ email: managerEmail.toLowerCase() });
  if (existingManager) {
    return;
  }

  const hashedPassword = await bcrypt.hash(managerPassword, 10);

  try {
    await User.create({
      name: managerName,
      email: managerEmail.toLowerCase(),
      password: hashedPassword,
      role: "manager",
    });

    console.log(`Default manager created: ${managerEmail}`);
  } catch (error) {
    // If two server processes bootstrap simultaneously, ignore duplicate seed insert.
    if (error?.code !== 11000) {
      throw error;
    }
  }
};
