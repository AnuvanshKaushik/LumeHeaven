import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeCategory = useMemo(
    () => new URLSearchParams(location.search).get("category") || "",
    [location.search]
  );

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await api.get("/categories");
        setCategories(data.slice(0, 8));
      } catch {
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const onOutsideClick = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setIsCategoryMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  useEffect(() => {
    setIsCategoryMenuOpen(false);
  }, [location.pathname, location.search]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="top-nav">
      <Link className="brand" to="/">
        LUMEHEAVEN
      </Link>
      <nav className="nav-main">
        <div className="nav-links">
          <Link to="/products">Shop</Link>
          <div
            className={`nav-dropdown ${isCategoryMenuOpen ? "open" : ""}`}
            ref={dropdownRef}
            onMouseEnter={() => setIsCategoryMenuOpen(true)}
            onMouseLeave={() => setIsCategoryMenuOpen(false)}
          >
            <button
              className={`nav-dropdown-trigger ${activeCategory ? "active" : ""}`}
              type="button"
              onClick={() => {
                if (!categories.length) {
                  navigate("/products");
                  return;
                }
                setIsCategoryMenuOpen((prev) => !prev);
              }}
              aria-expanded={isCategoryMenuOpen}
              aria-haspopup="true"
            >
              Categories
            </button>
            <div className={`nav-dropdown-menu glass ${isCategoryMenuOpen ? "open" : ""}`}>
              {categories.length ? (
                categories.map((category) => (
                  <Link
                    key={category._id}
                    className={activeCategory === category.slug ? "active" : ""}
                    to={`/products?category=${category.slug}`}
                    onClick={() => setIsCategoryMenuOpen(false)}
                  >
                    {category.name}
                  </Link>
                ))
              ) : (
                <Link to="/products" onClick={() => setIsCategoryMenuOpen(false)}>
                  Browse all
                </Link>
              )}
            </div>
          </div>
          {!user && (
            <>
              <Link to="/customer-auth">Customer</Link>
              <Link to="/manager-login">Manager</Link>
            </>
          )}
          {user?.role === "customer" && (
            <>
              <Link to="/customer/dashboard">Dashboard</Link>
              <Link to="/wishlist">Wishlist</Link>
              <Link to="/cart">Cart</Link>
            </>
          )}
          {user?.role === "manager" && (
            <>
              <Link to="/manager/dashboard">Dashboard</Link>
              <Link to="/manager/orders">Orders</Link>
              <Link to="/manager/analytics">Analytics</Link>
            </>
          )}
        </div>
        <div className="nav-actions">
          <button className="btn btn-ghost btn-sm" onClick={toggleTheme}>
            {theme === "light" ? "Dark" : "Light"}
          </button>
          {user && (
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
