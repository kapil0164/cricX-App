// client/src/components/Auth.jsx
import { useState } from "react";

export default function Auth({ onAuth }) {
  const [mode, setMode]         = useState("signin"); // "signin" | "signup"
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit() {
    setError("");
    if (!email || !password) return setError("Please fill in all fields.");
    if (mode === "signup" && !name) return setError("Please enter your name.");
    setLoading(true);
    try {
      await onAuth(mode, name, email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode(m => m === "signin" ? "signup" : "signin");
    setError("");
    setName(""); setEmail(""); setPassword("");
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1a0e3a 0%, #2d1760 50%, #1a0e3a 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <div style={{
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(196,176,255,0.15)",
        borderRadius: 24,
        padding: "40px 36px",
        width: "100%",
        maxWidth: 400,
        boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
      }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: "#fff", letterSpacing: -1 }}>
            cric<span style={{ color: "#a78bfa" }}>X</span>
          </div>
          <div style={{ color: "#9d8ec4", fontSize: 13, marginTop: 4 }}>Cricket Scorer</div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: 0 }}>
            {mode === "signin" ? "Welcome back 👋" : "Create account 🏏"}
          </h2>
          <p style={{ color: "#9d8ec4", fontSize: 13, margin: "6px 0 0" }}>
            {mode === "signin"
              ? "Sign in to continue scoring"
              : "Join cricX and start scoring matches"}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.15)",
            border: "1px solid rgba(239,68,68,0.4)",
            borderRadius: 10, padding: "10px 14px",
            color: "#fca5a5", fontSize: 13, marginBottom: 18,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Name field — signup only */}
        {mode === "signup" && (
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              placeholder="e.g. Devansh Kumar"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = "#a78bfa"}
              onBlur={e  => e.target.style.borderColor = "rgba(196,176,255,0.2)"}
            />
          </div>
        )}

        {/* Email */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = "#a78bfa"}
            onBlur={e  => e.target.style.borderColor = "rgba(196,176,255,0.2)"}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>Password</label>
          <div style={{ position: "relative" }}>
            <input
              type={showPass ? "text" : "password"}
              placeholder={mode === "signup" ? "Min 6 characters" : "Your password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={{ ...inputStyle, paddingRight: 44 }}
              onFocus={e => e.target.style.borderColor = "#a78bfa"}
              onBlur={e  => e.target.style.borderColor = "rgba(196,176,255,0.2)"}
            />
            <button
              onClick={() => setShowPass(v => !v)}
              style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: "#9d8ec4", fontSize: 16, padding: 4,
              }}
            >{showPass ? "🙈" : "👁"}</button>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%",
            background: loading
              ? "rgba(167,139,250,0.4)"
              : "linear-gradient(135deg, #7c3aed, #a78bfa)",
            border: "none", borderRadius: 12,
            color: "#fff", fontSize: 15, fontWeight: 700,
            padding: "14px 0", cursor: loading ? "not-allowed" : "pointer",
            transition: "opacity 0.2s",
            boxShadow: loading ? "none" : "0 4px 16px rgba(124,58,237,0.4)",
          }}
        >
          {loading
            ? "Please wait..."
            : mode === "signin" ? "Sign In" : "Create Account"}
        </button>

        {/* Switch mode */}
        <div style={{ textAlign: "center", marginTop: 24, color: "#9d8ec4", fontSize: 13 }}>
          {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={switchMode}
            style={{
              background: "none", border: "none",
              color: "#a78bfa", fontWeight: 700,
              cursor: "pointer", fontSize: 13, padding: 0,
            }}
          >
            {mode === "signin" ? "Sign Up" : "Sign In"}
          </button>
        </div>

      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  color: "#c4b0ff",
  fontSize: 12,
  fontWeight: 700,
  marginBottom: 8,
  letterSpacing: 0.4,
  textTransform: "uppercase",
};

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(196,176,255,0.2)",
  borderRadius: 10,
  padding: "12px 14px",
  color: "#fff",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
};