import React, { useState } from "react";
import "./login.css";

export default function ForgotPassword({ setPage }) {
    const [step, setStep] = useState(1); // 1: Enter email, 2: Enter code & new password
    const [email, setEmail] = useState("");
    const [resetCode, setResetCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [generatedCode, setGeneratedCode] = useState(""); // For dev mode

    const validateEmail = (v) => /\S+@\S+\.\S+/.test(v);

    const handleRequestCode = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!validateEmail(email)) {
            return setError("Please enter a valid email address.");
        }

        setLoading(true);
        try {
            const response = await fetch("http://localhost:4000/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Failed to send reset code.");
            } else {
                setSuccess("Reset code generated! Check below for your code.");
                setGeneratedCode(data.resetCode || "");
                setStep(2);
            }
        } catch (err) {
            setError("Unable to connect to server. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!resetCode || resetCode.length !== 6) {
            return setError("Please enter a valid 6-digit reset code.");
        }

        if (newPassword.length < 6) {
            return setError("Password must be at least 6 characters.");
        }

        if (newPassword !== confirmPassword) {
            return setError("Passwords do not match.");
        }

        setLoading(true);
        try {
            const response = await fetch("http://localhost:4000/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, resetCode, newPassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Failed to reset password.");
            } else {
                setSuccess("Password reset successful! Redirecting to login...");
                setTimeout(() => setPage("login"), 2000);
            }
        } catch (err) {
            setError("Unable to connect to server. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="lg-root">
            <form className="lg-card" onSubmit={step === 1 ? handleRequestCode : handleResetPassword}>
                <div className="lg-header">
                    <h2>🔐 Reset Password</h2>
                    <p className="muted">
                        {step === 1
                            ? "Enter your email to receive a reset code"
                            : "Enter the code and your new password"}
                    </p>
                </div>

                {error && <div className="lg-error" role="alert">{error}</div>}
                {success && (
                    <div className="lg-success" role="alert" style={{
                        background: 'rgba(72, 187, 120, 0.1)',
                        color: '#48bb78',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '15px',
                        border: '1px solid rgba(72, 187, 120, 0.3)'
                    }}>
                        {success}
                    </div>
                )}

                {step === 1 && (
                    <>
                        <label className="lg-label">Email Address</label>
                        <input
                            className="lg-input"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <button className="lg-submit" type="submit" disabled={loading}>
                            {loading ? "Sending..." : "Send Reset Code"}
                        </button>
                    </>
                )}

                {step === 2 && (
                    <>
                        {/* Show generated code in dev mode */}
                        {generatedCode && (
                            <div style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                padding: '20px',
                                borderRadius: '12px',
                                marginBottom: '20px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
                                    📧 Your Reset Code (Dev Mode)
                                </div>
                                <div style={{
                                    fontSize: '2rem',
                                    fontWeight: 'bold',
                                    letterSpacing: '8px',
                                    fontFamily: 'monospace'
                                }}>
                                    {generatedCode}
                                </div>
                                <div style={{ fontSize: '0.8rem', marginTop: '8px', opacity: 0.8 }}>
                                    In production, this would be sent to your email
                                </div>
                            </div>
                        )}

                        <label className="lg-label">Reset Code</label>
                        <input
                            className="lg-input"
                            type="text"
                            placeholder="Enter 6-digit code"
                            value={resetCode}
                            onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            maxLength={6}
                            style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '1.2rem' }}
                            required
                        />

                        <label className="lg-label">New Password</label>
                        <div className="lg-pass-row">
                            <input
                                className="lg-input"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="lg-show"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>

                        <label className="lg-label">Confirm Password</label>
                        <input
                            className="lg-input"
                            type={showPassword ? "text" : "password"}
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />

                        <button className="lg-submit" type="submit" disabled={loading}>
                            {loading ? "Resetting..." : "Reset Password"}
                        </button>

                        <button
                            type="button"
                            className="lg-link"
                            style={{ marginTop: '10px', display: 'block', width: '100%', textAlign: 'center' }}
                            onClick={() => {
                                setStep(1);
                                setResetCode("");
                                setNewPassword("");
                                setConfirmPassword("");
                                setError("");
                                setSuccess("");
                            }}
                        >
                            ← Request new code
                        </button>
                    </>
                )}

                <div className="lg-footer" style={{ marginTop: '20px' }}>
                    <button
                        type="button"
                        className="lg-create"
                        onClick={() => setPage("login")}
                    >
                        ← Back to Login
                    </button>
                </div>
            </form>
        </div>
    );
}
