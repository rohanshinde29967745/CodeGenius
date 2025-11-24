import React, { useRef, useState } from "react";
import "../login.css";

function Login({ setIsLoggedIn, setPage }) {
  const containerRef = useRef(null);

  const switchToRegister = () => containerRef.current.classList.add("active");
  const switchToLogin = () => containerRef.current.classList.remove("active");

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const handleLogin = () => {
    if (!email || !pass) return alert("Enter email & password");
    setIsLoggedIn(true);
    setPage("dashboard");
  };

  const handleRegister = () => {
    alert("Account created!");
    containerRef.current.classList.remove("active");
  };

  return (
    <div className="login-wrapper">
      <div className="login-container" ref={containerRef}>

        {/* LOGIN FORM */}
        <div className="form-box login-box">
          <h2>Login</h2>

          <div className="input-field">
            <input type="email" placeholder="Email" 
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div className="input-field">
            <input type="password" placeholder="Password"
              value={pass} onChange={e => setPass(e.target.value)} />
          </div>

          <button className="btn" onClick={handleLogin}>Login</button>

          <p className="switch-text">
            Don’t have an account? <span onClick={switchToRegister}>Register</span>
          </p>
        </div>

        {/* REGISTER FORM */}
        <div className="form-box register-box">
          <h2>Register</h2>

          <div className="input-field">
            <input type="text" placeholder="Full Name" />
          </div>

          <div className="input-field">
            <input type="email" placeholder="Email" />
          </div>

          <div className="input-field">
            <input type="password" placeholder="Password" />
          </div>

          <button className="btn" onClick={handleRegister}>Register</button>

          <p className="switch-text">
            Already have an account? <span onClick={switchToLogin}>Login</span>
          </p>
        </div>

      </div>
    </div>
  );
}

export default Login;
