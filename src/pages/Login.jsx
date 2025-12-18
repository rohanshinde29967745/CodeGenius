import React, { useState } from "react";
import "./login.css";

/*
 Props:
  - setPage(pageName)      // function from App to navigate pages
  - setIsLoggedIn(bool)    // function from App to mark user logged in
  - setUserRole(role)      // function from App to set user role
*/
export default function Login({ setPage, setIsLoggedIn, setUserRole }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [role, setRole] = useState("User"); // default role
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (v) => /\S+@\S+\.\S+/.test(v);

  const handleSubmit = async (e) => {
    e && e.preventDefault();
    setError("");
    if (!validateEmail(email)) return setError("Please enter a valid email.");
    if (!pass || pass.length < 4) return setError("Enter a valid password (min 4 chars).");

    setLoading(true);
    try {
      const response = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: pass,
          role: role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed. Please try again.");
        setLoading(false);
        return;
      }

      // Store user data and token in localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Set user role and mark as logged in
      if (setUserRole) setUserRole(data.user.role);
      setIsLoggedIn(true);

      // Route to appropriate page based on role
      if (data.user.role === "Admin") setPage("admin");
      else setPage("dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError("Unable to connect to server. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="lg-root">
      <form className="lg-card" onSubmit={handleSubmit} aria-labelledby="login-title">
        <div className="lg-header">
          <h2 id="login-title">Welcome back</h2>
          <p className="muted">Sign in to continue to CodeGenius</p>
        </div>

        {error && <div className="lg-error" role="alert">{error}</div>}

        <label className="lg-label">Email</label>
        <input
          className="lg-input"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="lg-label">Password</label>
        <div className="lg-pass-row">
          <input
            className="lg-input"
            type={showPass ? "text" : "password"}
            placeholder="••••••••"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            required
          />
          <button
            type="button"
            className="lg-show"
            aria-pressed={showPass}
            onClick={() => setShowPass((s) => !s)}
            title={showPass ? "Hide password" : "Show password"}
          >
            {showPass ? "Hide" : "Show"}
          </button>
        </div>

        <label className="lg-label">Role</label>
        <div className="lg-select-wrap" style={{ position: 'relative' }}>
          <select
            className="lg-select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            aria-label="Select role"
            style={{
              width: '100%',
              backgroundColor: '#ffffff',
              color: '#374151',
              border: '2px solid #7c3aed',
              borderRadius: '12px',
              padding: '14px 50px 14px 18px',
              fontSize: '15px',
              fontFamily: 'inherit',
              fontWeight: '500',
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="User" style={{ backgroundColor: '#ffffff', color: '#374151' }}>User</option>
            <option value="Admin" style={{ backgroundColor: '#ffffff', color: '#374151' }}>Admin</option>
          </select>
          {/* Arrow indicator */}
          <span style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: '#7c3aed',
            fontSize: '14px',
            fontWeight: 'bold',
          }}>
            ▼
          </span>
        </div>

        <div className="lg-row">
          <label className="lg-remember">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Remember me
          </label>

          <button
            type="button"
            className="lg-link"
            onClick={() => alert("Forgot password flow (implement backend)")}
          >
            Forgot?
          </button>
        </div>

        <button className="lg-submit" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <div className="lg-or">or sign in with</div>

        <div className="lg-socials">
          {/* Google Sign In */}
          <button
            type="button"
            className="social-btn social-google"
            title="Sign in with Google"
            onClick={() => {
              window.location.href = "http://localhost:4000/api/oauth/google";
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="22" height="22">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
            </svg>
          </button>

          {/* GitHub Sign In */}
          <button
            type="button"
            className="social-btn social-github"
            title="Sign in with GitHub"
            onClick={() => {
              window.location.href = "http://localhost:4000/api/oauth/github";
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </button>

          {/* Facebook Sign In - Coming Soon */}
          <button
            type="button"
            className="social-btn social-facebook"
            title="Coming Soon"
            disabled
            style={{ opacity: 0.5, cursor: 'not-allowed' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </button>
        </div>

        <div className="lg-footer">
          <small className="muted">New here?</small>
          <button
            type="button"
            className="lg-create"
            onClick={() => {
              setError("");
              setPage("register");
            }}
          >
            Create an account
          </button>
        </div>
      </form>
    </div>
  );
}
