import { useEffect, useRef } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "react-hot-toast";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerAuth from "./pages/CustomerAuth";
import Home from "./pages/Home";
import ManagerAnalyticsPage from "./pages/ManagerAnalyticsPage";
import ManagerDashboard from "./pages/ManagerDashboard";
import ManagerLogin from "./pages/ManagerLogin";
import ManagerOrdersPage from "./pages/ManagerOrdersPage";
import NotFoundPage from "./pages/NotFoundPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import ProductsPage from "./pages/ProductsPage";
import ProfilePage from "./pages/ProfilePage";
import WishlistPage from "./pages/WishlistPage";
import { useLocation } from "react-router-dom";

const AnimatedRoutes = () => {
  const location = useLocation();
  const routeKey = location.pathname + location.search;
  const audioContextRef = useRef(null);
  const hasInteractedRef = useRef(false);
  const previousRouteRef = useRef(routeKey);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return undefined;
    }

    const unlockAudio = () => {
      hasInteractedRef.current = true;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }

      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume().catch(() => {});
      }
    };

    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio, { passive: true });
    window.addEventListener("touchstart", unlockAudio, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
  }, []);

  useEffect(() => {
    const lastRoute = previousRouteRef.current;
    previousRouteRef.current = routeKey;

    if (lastRoute === routeKey || !hasInteractedRef.current || typeof window === "undefined") {
      return;
    }

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      return;
    }

    const ctx = audioContextRef.current;
    if (!ctx) {
      return;
    }

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    const lowPass = ctx.createBiquadFilter();
    const shimmerEcho = ctx.createDelay();
    const echoGain = ctx.createGain();

    masterGain.gain.value = 0.26;
    lowPass.type = "lowpass";
    lowPass.frequency.value = 1800;
    lowPass.Q.value = 0.7;
    shimmerEcho.delayTime.value = 0.09;
    echoGain.gain.value = 0.12;

    masterGain.connect(lowPass);
    lowPass.connect(ctx.destination);
    lowPass.connect(shimmerEcho);
    shimmerEcho.connect(echoGain);
    echoGain.connect(lowPass);

    const notes = [
      { frequency: 784, offset: 0, gain: 0.015, type: "triangle", duration: 0.34 },
      { frequency: 1047, offset: 0.06, gain: 0.012, type: "sine", duration: 0.3 },
      { frequency: 1319, offset: 0.115, gain: 0.009, type: "sine", duration: 0.24 },
    ];

    notes.forEach(({ frequency, offset, gain, type, duration }) => {
      const oscillator = ctx.createOscillator();
      const envelope = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now + offset);

      envelope.gain.setValueAtTime(0.0001, now + offset);
      envelope.gain.exponentialRampToValueAtTime(gain, now + offset + 0.03);
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + offset + duration);

      oscillator.connect(envelope);
      envelope.connect(masterGain);
      oscillator.start(now + offset);
      oscillator.stop(now + offset + duration + 0.03);
    });
  }, [routeKey]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="route-transition-shell"
        key={routeKey}
        initial={{ opacity: 0, y: 22, scale: 0.992 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -18, scale: 1.004 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.span
          className="route-transition-glow"
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: [0, 0.55, 0], scale: [0.95, 1.1, 1.16] }}
          transition={{ duration: 0.72, ease: "easeOut" }}
        />
        <motion.span
          className="route-transition-spark route-transition-spark-a"
          aria-hidden="true"
          initial={{ opacity: 0, y: 10, scale: 0.55 }}
          animate={{ opacity: [0, 1, 0], y: [10, -7, -15], scale: [0.55, 1.2, 0.86] }}
          transition={{ duration: 0.72, delay: 0.03, ease: "easeOut" }}
        />
        <motion.span
          className="route-transition-spark route-transition-spark-b"
          aria-hidden="true"
          initial={{ opacity: 0, y: 8, scale: 0.5 }}
          animate={{ opacity: [0, 0.98, 0], y: [8, -6, -13], scale: [0.5, 1.12, 0.8] }}
          transition={{ duration: 0.74, delay: 0.08, ease: "easeOut" }}
        />
        <motion.span
          className="route-transition-spark route-transition-spark-c"
          aria-hidden="true"
          initial={{ opacity: 0, y: 9, scale: 0.52 }}
          animate={{ opacity: [0, 0.92, 0], y: [9, -5, -12], scale: [0.52, 1.08, 0.78] }}
          transition={{ duration: 0.7, delay: 0.13, ease: "easeOut" }}
        />
        <motion.span
          className="route-transition-spark route-transition-spark-d"
          aria-hidden="true"
          initial={{ opacity: 0, y: 8, scale: 0.5 }}
          animate={{ opacity: [0, 0.9, 0], y: [8, -4, -10], scale: [0.5, 1.04, 0.76] }}
          transition={{ duration: 0.72, delay: 0.17, ease: "easeOut" }}
        />
        <motion.span
          className="route-transition-spark route-transition-spark-e"
          aria-hidden="true"
          initial={{ opacity: 0, y: 10, scale: 0.5 }}
          animate={{ opacity: [0, 0.9, 0], y: [10, -6, -14], scale: [0.5, 1.08, 0.78] }}
          transition={{ duration: 0.74, delay: 0.2, ease: "easeOut" }}
        />
        <motion.span
          className="route-transition-spark route-transition-spark-f"
          aria-hidden="true"
          initial={{ opacity: 0, y: 9, scale: 0.48 }}
          animate={{ opacity: [0, 0.85, 0], y: [9, -5, -11], scale: [0.48, 1.02, 0.74] }}
          transition={{ duration: 0.68, delay: 0.24, ease: "easeOut" }}
        />
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailsPage />} />
          <Route path="/customer-auth" element={<CustomerAuth />} />
          <Route path="/manager-login" element={<ManagerLogin />} />

          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute allowedRole="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute allowedRole="customer">
                <WishlistPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute allowedRole="customer">
                <CartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowedRole="customer">
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute allowedRole="customer">
                <OrderHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRole="customer">
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/dashboard"
            element={
              <ProtectedRoute allowedRole="manager">
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/orders"
            element={
              <ProtectedRoute allowedRole="manager">
                <ManagerOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/analytics"
            element={
              <ProtectedRoute allowedRole="manager">
                <ManagerAnalyticsPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Navbar />
          <AnimatedRoutes />
          <Footer />
          <Toaster position="top-right" />
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
