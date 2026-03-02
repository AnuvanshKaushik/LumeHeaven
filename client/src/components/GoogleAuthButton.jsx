import { useState } from "react";
import toast from "react-hot-toast";

const GoogleAuthButton = () => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
    if (!apiBase) {
      toast.error("Google login is not configured");
      return;
    }

    const authUrl = `${apiBase.replace(/\/$/, "")}/auth/google`;
    setLoading(true);
    window.location.href = authUrl;
  };

  return (
    <button className="btn google-btn" type="button" onClick={handleGoogleLogin} disabled={loading}>
      <span className="google-icon" aria-hidden>
        G
      </span>
      <span>{loading ? "Connecting..." : "Continue with Google"}</span>
    </button>
  );
};

export default GoogleAuthButton;
