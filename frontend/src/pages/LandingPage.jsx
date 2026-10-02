// src/pages/LandingPage.jsx
import "./LandingPage.css";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3000/api/users/login", {
        email: String(email || "").toLowerCase(),
        password,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.user.id);
      navigate("/home");
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      const status = err.response?.status;
      if (status === 403) {
        alert("Please verify your account. We’re taking you to the verify page.");
        navigate(`/verify?email=${encodeURIComponent(String(email || "").toLowerCase())}`);
        return;
      }
      alert("Login failed: " + (msg || "Check credentials"));
    }
  };

  return (
    <div className="landing-container">
      <div className="landing-grid">
        {/* LEFT: Hero */}
        <section className="hero-section">
          <h1 className="hero-title">HIERARCHY</h1>
          <p className="hero-subtitle">
            {"Got a dream?\nLet’s make it happen."}
          </p>
        </section>

        {/* RIGHT: Auth card */}
        <aside className="auth-section">
          <div className="auth-card">
            <h2 className="auth-title">Join Hierarchy</h2>

            <form className="form" onSubmit={handleLogin}>
              {/* Email */}
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password with eye toggle */}
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-wrap">
                  <input
                    className="form-input"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-eye"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      /* eye-off */
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 5c4.5 0 8.5 2.6 10.5 7-1 2.2-2.6 4-4.6 5.3l1.8 1.8-1.4 1.4-3-3A10.8 10.8 0 0 1 12 19C7.5 19 3.5 16.4 1.5 12a12.8 12.8 0 0 1 4.2-5.1L3.1 4.3 4.5 3l3.2 3.2A12.2 12.2 0 0 1 12 5Zm0 2c-1 0-1.9.2-2.8.5l1.6 1.6A3 3 0 0 1 15 12c0 .5-.1 1-.3 1.4l1.6 1.6A5 5 0 0 0 12 7Zm-6.9 2.1A10.6 10.6 0 0 0 3.6 12c1.7 3.4 5 5 8.4 5 .9 0 1.8-.1 2.6-.4l-2-2A5 5 0 0 1 7 12c0-.9.2-1.8.6-2.6L5.1 9.1Z" />
                      </svg>
                    ) : (
                      /* eye */
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 5c4.5 0 8.5 2.6 10.5 7-2 4.4-6 7-10.5 7S3.5 16.4 1.5 12C3.5 7.6 7.5 5 12 5Zm0 2C8.6 7 5.3 8.6 3.6 12c1.7 3.4 5 5 8.4 5s6.7-1.6 8.4-5C18.7 8.6 15.4 7 12 7Zm0 2.5A2.5 2.5 0 1 1 9.5 12 2.5 2.5 0 0 1 12 9.5Z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="form-actions">
                <button type="submit" className="btn-signin">Sign in</button>
                <span className="forgot-line">
                  <Link to="/forgot-password" className="forgot-password">
                    Forgot Password
                  </Link>
                </span>
              </div>
            </form>

            {/* Create account */}
            <div className="create-account-wrap">
              <div className="create-account-text">Don’t have an account?</div>
              <Link to="/signup" className="create-account-btn">
                Create account
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
