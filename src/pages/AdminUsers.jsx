import React, { useState, useEffect } from "react";
import { API_BASE } from "../services/api";
import "../App.css";

function AdminUsers({ setPage }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => setSelectedUser(null);

  const formatDate = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (d) => {
    if (!d) return "Never";
    return new Date(d).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      !searchTerm ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(u.id).includes(searchTerm);
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesLevel =
      levelFilter === "all" || u.current_level === levelFilter;
    return matchesSearch && matchesRole && matchesLevel;
  });

  const getLevelColor = (level) => {
    const map = {
      Bronze: "#cd7f32",
      Silver: "#c0c0c0",
      Gold: "#ffd700",
      Platinum: "#e5e4e2",
    };
    return map[level] || "#94a3b8";
  };

  const getRankBadge = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  /* ─── Styles ─── */
  const s = {
    page: {
      padding: "30px",
      background: "var(--bg-primary, #0f172a)",
      minHeight: "100vh",
    },
    backBtn: {
      padding: "8px 16px",
      background: "var(--bg-secondary, #1e293b)",
      border: "1px solid #334155",
      color: "var(--text-primary, #e2e8f0)",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "0.85rem",
      fontWeight: "500",
      marginBottom: "20px",
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      transition: "all 0.2s",
    },
    title: {
      fontSize: "1.8rem",
      fontWeight: "700",
      color: "var(--text-primary, #f8fafc)",
      margin: "0 0 4px 0",
    },
    subtitle: {
      color: "#94a3b8",
      margin: "0 0 24px 0",
      fontSize: "0.9rem",
    },
    toolbar: {
      display: "flex",
      gap: "12px",
      marginBottom: "20px",
      flexWrap: "wrap",
      alignItems: "center",
    },
    search: {
      flex: "1",
      minWidth: "200px",
      padding: "10px 14px",
      background: "var(--bg-secondary, #1e293b)",
      border: "1px solid #334155",
      borderRadius: "8px",
      color: "var(--text-primary, #e2e8f0)",
      fontSize: "0.9rem",
      outline: "none",
    },
    select: {
      padding: "10px 14px",
      background: "var(--bg-secondary, #1e293b)",
      border: "1px solid #334155",
      borderRadius: "8px",
      color: "var(--text-primary, #e2e8f0)",
      fontSize: "0.85rem",
      outline: "none",
      cursor: "pointer",
    },
    badge: {
      display: "inline-block",
      padding: "3px 8px",
      borderRadius: "12px",
      fontSize: "0.7rem",
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
    },
    panel: {
      background: "var(--bg-secondary, #1e293b)",
      border: "1px solid #334155",
      borderRadius: "12px",
      overflow: "hidden",
    },
    th: {
      padding: "14px 16px",
      color: "#94a3b8",
      fontSize: "0.8rem",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      borderBottom: "1px solid #334155",
      background: "rgba(0,0,0,0.15)",
      textAlign: "left",
      whiteSpace: "nowrap",
    },
    td: {
      padding: "14px 16px",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      fontSize: "0.9rem",
      color: "var(--text-primary, #e2e8f0)",
      whiteSpace: "nowrap",
    },
    viewBtn: {
      padding: "6px 14px",
      background: "rgba(59,130,246,0.15)",
      color: "#60a5fa",
      border: "1px solid rgba(59,130,246,0.3)",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "0.8rem",
      fontWeight: "600",
      transition: "all 0.2s",
    },
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.75)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      backdropFilter: "blur(4px)",
    },
    modal: {
      background: "#1e293b",
      width: "580px",
      maxWidth: "95vw",
      maxHeight: "90vh",
      borderRadius: "16px",
      overflow: "hidden",
      border: "1px solid #334155",
      boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
      display: "flex",
      flexDirection: "column",
    },
    modalHeader: {
      padding: "20px 24px",
      borderBottom: "1px solid #334155",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "rgba(0,0,0,0.1)",
    },
    modalBody: {
      padding: "24px",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    },
    infoCard: {
      background: "rgba(0,0,0,0.2)",
      padding: "14px",
      borderRadius: "10px",
      border: "1px solid rgba(255,255,255,0.04)",
    },
    infoLabel: {
      fontSize: "0.75rem",
      color: "#64748b",
      marginBottom: "4px",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      fontWeight: "600",
    },
    infoValue: {
      color: "#e2e8f0",
      fontSize: "0.95rem",
    },
    statBox: {
      textAlign: "center",
      background: "rgba(0,0,0,0.2)",
      padding: "16px",
      borderRadius: "10px",
      border: "1px solid rgba(255,255,255,0.04)",
    },
    statValue: {
      fontSize: "1.4rem",
      fontWeight: "700",
      display: "block",
    },
    statLabel: {
      fontSize: "0.75rem",
      color: "#64748b",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
    },
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <button style={s.backBtn} onClick={() => setPage("admin")}>
        ← Back to Dashboard
      </button>
      <h1 style={s.title}>👥 User Management & Rankings</h1>
      <p style={s.subtitle}>
        All {users.length} registered users ranked by total points — click any
        user to see full profile details
      </p>

      {/* Toolbar */}
      <div style={s.toolbar}>
        <input
          style={s.search}
          placeholder="Search by name, email, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          style={s.select}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="User">User</option>
          <option value="Admin">Admin</option>
        </select>
        <select
          style={s.select}
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
        >
          <option value="all">All Levels</option>
          <option value="Bronze">Bronze</option>
          <option value="Silver">Silver</option>
          <option value="Gold">Gold</option>
          <option value="Platinum">Platinum</option>
        </select>
        <span
          style={{
            color: "#64748b",
            fontSize: "0.85rem",
          }}
        >
          Showing {filtered.length} of {users.length}
        </span>
      </div>

      {/* Table */}
      <div style={s.panel}>
        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              Loading users...
            </div>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  <th style={s.th}>Rank</th>
                  <th style={s.th}>User</th>
                  <th style={s.th}>Role</th>
                  <th style={s.th}>Level</th>
                  <th style={s.th}>Points</th>
                  <th style={s.th}>Solved</th>
                  <th style={s.th}>Accuracy</th>
                  <th style={s.th}>Streak</th>
                  <th style={s.th}>Joined</th>
                  <th style={s.th}>Last Active</th>
                  <th style={s.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, index) => (
                  <tr
                    key={user.id}
                    style={{
                      transition: "background 0.15s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(59,130,246,0.05)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                    onClick={() => setSelectedUser(user)}
                  >
                    <td
                      style={{
                        ...s.td,
                        fontWeight: "bold",
                        fontSize: index < 3 ? "1.1rem" : "0.9rem",
                        color: index < 3 ? "#fbbf24" : "#94a3b8",
                      }}
                    >
                      {getRankBadge(index)}
                    </td>
                    <td style={s.td}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: user.profile_photo_url
                              ? `url(${user.profile_photo_url}) center/cover`
                              : "#3b82f6",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontWeight: "bold",
                            fontSize: "0.85rem",
                            flexShrink: 0,
                          }}
                        >
                          {!user.profile_photo_url &&
                            user.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: "600" }}>
                            {user.full_name}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#64748b",
                              fontFamily: "monospace",
                            }}
                          >
                            ID: {user.id} · {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={s.td}>
                      <span
                        style={{
                          ...s.badge,
                          background:
                            user.role === "Admin"
                              ? "rgba(239,68,68,0.15)"
                              : "rgba(59,130,246,0.15)",
                          color:
                            user.role === "Admin" ? "#f87171" : "#60a5fa",
                          border: `1px solid ${user.role === "Admin" ? "rgba(239,68,68,0.3)" : "rgba(59,130,246,0.3)"}`,
                        }}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td style={s.td}>
                      <span
                        style={{
                          color: getLevelColor(user.current_level),
                          fontWeight: "600",
                        }}
                      >
                        {user.current_level}
                      </span>
                    </td>
                    <td
                      style={{
                        ...s.td,
                        color: "#a78bfa",
                        fontWeight: "700",
                      }}
                    >
                      {user.total_points}
                    </td>
                    <td
                      style={{
                        ...s.td,
                        color: "#10b981",
                        fontWeight: "600",
                      }}
                    >
                      {user.problems_solved}
                    </td>
                    <td style={s.td}>
                      {parseFloat(user.accuracy_rate || 0).toFixed(1)}%
                    </td>
                    <td style={s.td}>🔥 {user.current_streak || 0}</td>
                    <td style={{ ...s.td, color: "#94a3b8" }}>
                      {formatDate(user.created_at)}
                    </td>
                    <td style={{ ...s.td, color: "#94a3b8" }}>
                      {formatDateTime(user.last_activity_at)}
                    </td>
                    <td style={s.td}>
                      <button
                        style={s.viewBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(user);
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan="11"
                      style={{
                        padding: "40px",
                        textAlign: "center",
                        color: "#64748b",
                      }}
                    >
                      No users match your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ─── User Details Modal ─── */}
      {selectedUser && (
        <div style={s.overlay} onClick={closeModal}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={s.modalHeader}>
              <h3
                style={{
                  margin: 0,
                  color: "white",
                  fontSize: "1.1rem",
                  fontWeight: "700",
                }}
              >
                Complete User Profile
              </h3>
              <button
                onClick={closeModal}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: "1.3rem",
                  padding: "4px",
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={s.modalBody}>
              {/* Profile Header */}
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background: selectedUser.profile_photo_url
                      ? `url(${selectedUser.profile_photo_url}) center/cover`
                      : "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.6rem",
                    color: "white",
                    fontWeight: "bold",
                    flexShrink: 0,
                  }}
                >
                  {!selectedUser.profile_photo_url &&
                    selectedUser.full_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4
                    style={{
                      margin: "0 0 6px 0",
                      color: "white",
                      fontSize: "1.3rem",
                    }}
                  >
                    {selectedUser.full_name}
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        ...s.badge,
                        background:
                          selectedUser.role === "Admin"
                            ? "rgba(239,68,68,0.2)"
                            : "rgba(59,130,246,0.2)",
                        color:
                          selectedUser.role === "Admin"
                            ? "#f87171"
                            : "#60a5fa",
                      }}
                    >
                      {selectedUser.role}
                    </span>
                    <span
                      style={{
                        ...s.badge,
                        background: "rgba(255,215,0,0.1)",
                        color: getLevelColor(selectedUser.current_level),
                      }}
                    >
                      {selectedUser.current_level}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "10px",
                }}
              >
                <div style={s.statBox}>
                  <span style={{ ...s.statValue, color: "#a78bfa" }}>
                    {selectedUser.total_points}
                  </span>
                  <span style={s.statLabel}>Total Points</span>
                </div>
                <div style={s.statBox}>
                  <span style={{ ...s.statValue, color: "#10b981" }}>
                    {selectedUser.problems_solved}
                  </span>
                  <span style={s.statLabel}>Solved</span>
                </div>
                <div style={s.statBox}>
                  <span style={{ ...s.statValue, color: "#3b82f6" }}>
                    {parseFloat(selectedUser.accuracy_rate || 0).toFixed(1)}%
                  </span>
                  <span style={s.statLabel}>Accuracy</span>
                </div>
                <div style={s.statBox}>
                  <span style={{ ...s.statValue, color: "#f59e0b" }}>
                    🔥 {selectedUser.current_streak || 0}
                  </span>
                  <span style={s.statLabel}>Streak</span>
                </div>
              </div>

              {/* XP Progress */}
              <div style={s.infoCard}>
                <div style={s.infoLabel}>XP Progress</div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginTop: "6px",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: "8px",
                      background: "rgba(0,0,0,0.3)",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(((selectedUser.current_xp || 0) / (selectedUser.xp_to_next_level || 1000)) * 100, 100)}%`,
                        background:
                          "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                        borderRadius: "4px",
                        transition: "width 0.3s",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      color: "#94a3b8",
                      fontSize: "0.85rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {selectedUser.current_xp || 0} /{" "}
                    {selectedUser.xp_to_next_level || 1000} XP
                  </span>
                </div>
              </div>

              {/* Submission Stats */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "10px",
                }}
              >
                <div style={s.infoCard}>
                  <div style={s.infoLabel}>Total Submissions</div>
                  <div style={{ ...s.infoValue, fontWeight: "700" }}>
                    {selectedUser.total_submissions || 0}
                  </div>
                </div>
                <div style={s.infoCard}>
                  <div style={s.infoLabel}>Accepted</div>
                  <div
                    style={{
                      ...s.infoValue,
                      fontWeight: "700",
                      color: "#10b981",
                    }}
                  >
                    {selectedUser.accepted_submissions || 0}
                  </div>
                </div>
                <div style={s.infoCard}>
                  <div style={s.infoLabel}>Longest Streak</div>
                  <div
                    style={{
                      ...s.infoValue,
                      fontWeight: "700",
                      color: "#f59e0b",
                    }}
                  >
                    {selectedUser.longest_streak || 0} days
                  </div>
                </div>
              </div>

              {/* Personal Info */}
              <div style={s.infoCard}>
                <div
                  style={{
                    ...s.infoLabel,
                    marginBottom: "10px",
                    fontSize: "0.8rem",
                  }}
                >
                  Personal Information
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    fontSize: "0.88rem",
                    color: "#cbd5e1",
                  }}
                >
                  <div>
                    <strong style={{ color: "#94a3b8" }}>User ID:</strong>{" "}
                    <span style={{ fontFamily: "monospace" }}>
                      {selectedUser.id}
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: "#94a3b8" }}>Email:</strong>{" "}
                    {selectedUser.email}
                  </div>
                  <div>
                    <strong style={{ color: "#94a3b8" }}>Location:</strong>{" "}
                    {selectedUser.location || "Not set"}
                  </div>
                  <div>
                    <strong style={{ color: "#94a3b8" }}>Theme:</strong>{" "}
                    {selectedUser.theme_preference || "dark"}
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <strong style={{ color: "#94a3b8" }}>Bio:</strong>{" "}
                    {selectedUser.bio || "No bio provided"}
                  </div>
                </div>
              </div>

              {/* Links */}
              <div style={s.infoCard}>
                <div
                  style={{
                    ...s.infoLabel,
                    marginBottom: "10px",
                    fontSize: "0.8rem",
                  }}
                >
                  External Links
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    fontSize: "0.88rem",
                    color: "#cbd5e1",
                  }}
                >
                  <div>
                    <strong style={{ color: "#94a3b8" }}>GitHub:</strong>{" "}
                    {selectedUser.github_url ? (
                      <a
                        href={selectedUser.github_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#60a5fa" }}
                      >
                        {selectedUser.github_url}
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </div>
                  <div>
                    <strong style={{ color: "#94a3b8" }}>LinkedIn:</strong>{" "}
                    {selectedUser.linkedin_url ? (
                      <a
                        href={selectedUser.linkedin_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#60a5fa" }}
                      >
                        {selectedUser.linkedin_url}
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div style={s.infoCard}>
                <div
                  style={{
                    ...s.infoLabel,
                    marginBottom: "10px",
                    fontSize: "0.8rem",
                  }}
                >
                  Activity Timeline
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    fontSize: "0.85rem",
                    color: "#cbd5e1",
                  }}
                >
                  <div>
                    <strong style={{ color: "#94a3b8" }}>
                      Joined:
                    </strong>{" "}
                    {formatDate(selectedUser.created_at)}
                  </div>
                  <div>
                    <strong style={{ color: "#94a3b8" }}>
                      Last Login:
                    </strong>{" "}
                    {formatDateTime(selectedUser.last_login_at)}
                  </div>
                  <div>
                    <strong style={{ color: "#94a3b8" }}>
                      Last Active:
                    </strong>{" "}
                    {formatDateTime(selectedUser.last_activity_at)}
                  </div>
                  <div>
                    <strong style={{ color: "#94a3b8" }}>
                      Profile Updated:
                    </strong>{" "}
                    {formatDateTime(selectedUser.updated_at)}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #334155",
                textAlign: "right",
                background: "rgba(0,0,0,0.1)",
              }}
            >
              <button
                onClick={closeModal}
                style={{
                  padding: "8px 20px",
                  background: "#334155",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "0.85rem",
                  transition: "all 0.2s",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
