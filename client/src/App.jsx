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
    const notes = [
      { frequency: 1480, offset: 0, gain: 0.022 },
      { frequency: 1760, offset: 0.04, gain: 0.02 },
      { frequency: 2093, offset: 0.085, gain: 0.017 },
    ];

    notes.forEach(({ frequency, offset, gain }) => {
      const oscillator = ctx.createOscillator();
      const envelope = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, now + offset);

      envelope.gain.setValueAtTime(0.0001, now + offset);
      envelope.gain.exponentialRampToValueAtTime(gain, now + offset + 0.02);
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.24);

      oscillator.connect(envelope);
      envelope.connect(ctx.destination);
      oscillator.start(now + offset);
      oscillator.stop(now + offset + 0.26);
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
          animate={{ opacity: [0, 0.35, 0], scale: [0.95, 1.08, 1.12] }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        />
        <motion.span
          className="route-transition-spark route-transition-spark-a"
          aria-hidden="true"
          initial={{ opacity: 0, y: 8, scale: 0.6 }}
          animate={{ opacity: [0, 0.85, 0], y: [8, -6, -12], scale: [0.6, 1, 0.8] }}
          transition={{ duration: 0.6, delay: 0.05, ease: "easeOut" }}
        />
        <motion.span
          className="route-transition-spark route-transition-spark-b"
          aria-hidden="true"
          initial={{ opacity: 0, y: 6, scale: 0.5 }}
          animate={{ opacity: [0, 0.8, 0], y: [6, -4, -10], scale: [0.5, 0.95, 0.75] }}
          transition={{ duration: 0.6, delay: 0.12, ease: "easeOut" }}
        />
        <motion.span
          className="route-transition-spark route-transition-spark-c"
          aria-hidden="true"
          initial={{ opacity: 0, y: 7, scale: 0.55 }}
          animate={{ opacity: [0, 0.75, 0], y: [7, -5, -11], scale: [0.55, 0.9, 0.72] }}
          transition={{ duration: 0.58, delay: 0.16, ease: "easeOut" }}
        />
        <motion.span
          className="route-transition-spark route-transition-spark-d"
          aria-hidden="true"
          initial={{ opacity: 0, y: 7, scale: 0.52 }}
          animate={{ opacity: [0, 0.72, 0], y: [7, -3, -9], scale: [0.52, 0.88, 0.7] }}
          transition={{ duration: 0.62, delay: 0.2, ease: "easeOut" }}
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
