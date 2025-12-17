import React, { useEffect, useState } from "react";
import "../App.css";

function OAuthCallback({ setIsLoggedIn, setUserRole, setPage }) {
    const [status, setStatus] = useState("Processing...");
    const [error, setError] = useState(null);

    useEffect(() => {
        const handleCallback = () => {
            try {
                // Get URL parameters
                const urlParams = new URLSearchParams(window.location.search);
                const token = urlParams.get("token");
                const userDataEncoded = urlParams.get("user");
                const errorParam = urlParams.get("error");

                if (errorParam) {
                    setError(`Authentication failed: ${errorParam.replace(/_/g, " ")}`);
                    setStatus("Failed");
                    return;
                }

                if (!token || !userDataEncoded) {
                    setError("No authentication data received");
                    setStatus("Failed");
                    return;
                }

                // Parse user data
                const userData = JSON.parse(decodeURIComponent(userDataEncoded));

                // Store in localStorage
                localStorage.setItem("token", token);
                localStorage.setItem("user", JSON.stringify(userData));

                // Update app state
                setIsLoggedIn(true);
                setUserRole(userData.role || "User");

                setStatus("Success! Redirecting...");

                // Redirect to appropriate page
                setTimeout(() => {
                    // Clear the URL params
                    window.history.replaceState({}, document.title, "/");
                    if (userData.role === "Admin") {
                        setPage("admin");
                    } else {
                        setPage("dashboard");
                    }
                }, 1000);

            } catch (err) {
                console.error("OAuth callback error:", err);
                setError("Failed to process authentication");
                setStatus("Failed");
            }
        };

        handleCallback();
    }, [setIsLoggedIn, setUserRole, setPage]);

    return (
        <div className="lg-root" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="lg-card" style={{ textAlign: "center", padding: "40px" }}>
                {error ? (
                    <>
                        <div style={{ fontSize: "48px", marginBottom: "20px" }}>❌</div>
                        <h2 style={{ color: "#ef4444", marginBottom: "12px" }}>Login Failed</h2>
                        <p style={{ color: "#666", marginBottom: "24px" }}>{error}</p>
                        <button
                            className="lg-submit"
                            onClick={() => setPage("login")}
                            style={{ width: "auto", padding: "12px 32px" }}
                        >
                            Back to Login
                        </button>
                    </>
                ) : (
                    <>
                        <div style={{ fontSize: "48px", marginBottom: "20px" }}>
                            {status === "Success! Redirecting..." ? "✅" : "⏳"}
                        </div>
                        <h2 style={{ marginBottom: "12px" }}>{status}</h2>
                        <p style={{ color: "#666" }}>
                            {status === "Success! Redirecting..."
                                ? "Taking you to your dashboard..."
                                : "Please wait while we complete your login..."}
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

export default OAuthCallback;
