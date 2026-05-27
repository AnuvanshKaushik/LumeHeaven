import { useState } from "react";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../api/axios";

const GoogleAuthButton = () => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    if (!API_BASE_URL) {
      toast.error("Google login is not configured");
      return;
    }

    const authUrl = `${API_BASE_URL}/auth/google`;
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
