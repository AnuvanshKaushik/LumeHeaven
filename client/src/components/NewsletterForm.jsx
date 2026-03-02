import { useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NewsletterForm = ({ placeholder = "Enter your email" }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/newsletter/subscribe", { email: normalizedEmail });
      toast.success(data?.message || "Subscribed successfully");
      if (data?.emailStatus && data.emailStatus !== "sent") {
        toast.error("Subscription saved, but confirmation email could not be sent");
      }
      setEmail("");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to subscribe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="newsletter-inline" onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder={placeholder}
        required
        disabled={loading}
      />
      <button className="btn newsletter-btn ripple" type="submit" disabled={loading}>
        {loading ? (
          <>
            <span className="inline-spinner" />
            <span>Subscribing...</span>
          </>
        ) : (
          "Subscribe"
        )}
      </button>
    </form>
  );
};

export default NewsletterForm;
