from pathlib import Path

ROOT = Path("frontend/src")

# ------------------------------------------------------------
# 1. Modern dashboard visual system
# ------------------------------------------------------------

css = r"""
/* ============================================================
   DYP MODERN UI OVERRIDE
   ============================================================ */

:root {
  --dyp-bg: #07111f;
  --dyp-bg-soft: #0b1728;
  --dyp-card: rgba(16, 29, 48, 0.82);
  --dyp-card-hover: rgba(22, 39, 63, 0.92);
  --dyp-border: rgba(148, 163, 184, 0.14);

  --dyp-text: #f8fafc;
  --dyp-muted: #94a3b8;

  --dyp-primary: #7c3aed;
  --dyp-primary-light: #a78bfa;
  --dyp-blue: #38bdf8;
  --dyp-green: #34d399;
  --dyp-yellow: #fbbf24;
  --dyp-pink: #f472b6;
  --dyp-red: #fb7185;

  --dyp-radius: 20px;
  --dyp-shadow:
    0 20px 50px rgba(0, 0, 0, 0.25);

  --dyp-gradient:
    linear-gradient(
      135deg,
      #7c3aed 0%,
      #2563eb 50%,
      #06b6d4 100%
    );
}

/* Page background */

body {
  background:
    radial-gradient(
      circle at 10% 0%,
      rgba(124, 58, 237, 0.16),
      transparent 32%
    ),
    radial-gradient(
      circle at 90% 10%,
      rgba(56, 189, 248, 0.12),
      transparent 28%
    ),
    var(--dyp-bg);
  color: var(--dyp-text);
}

/* Main dashboard containers */

.dashboard,
.dashboard-page,
.player-dashboard,
.admin-dashboard,
.page-container {
  color: var(--dyp-text);
}

/* Cards */

.dashboard-card,
.stat-card,
.card,
.panel,
.dashboard-panel {
  background: var(--dyp-card);
  border: 1px solid var(--dyp-border);
  border-radius: var(--dyp-radius);
  box-shadow: var(--dyp-shadow);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease;
}

.dashboard-card:hover,
.stat-card:hover,
.card:hover,
.panel:hover,
.dashboard-panel:hover {
  transform: translateY(-2px);
  background: var(--dyp-card-hover);
  border-color: rgba(167, 139, 250, 0.28);
}

/* Buttons */

button,
.btn,
.button {
  border-radius: 12px;
  transition:
    transform 150ms ease,
    box-shadow 150ms ease,
    filter 150ms ease;
}

button:hover,
.btn:hover,
.button:hover {
  transform: translateY(-1px);
}

button:active,
.btn:active,
.button:active {
  transform: translateY(0);
}

/* Primary actions */

button[class*="primary"],
.btn-primary,
.button-primary {
  background: var(--dyp-gradient);
  color: white;
  border: 0;
  box-shadow:
    0 8px 24px rgba(124, 58, 237, 0.25);
}

button[class*="primary"]:hover,
.btn-primary:hover,
.button-primary:hover {
  filter: brightness(1.08);
  box-shadow:
    0 12px 30px rgba(124, 58, 237, 0.34);
}

/* Headings */

.dashboard h1,
.dashboard-page h1,
.player-dashboard h1,
.admin-dashboard h1 {
  letter-spacing: -0.035em;
  font-weight: 800;
}

.dashboard h2,
.dashboard-page h2,
.player-dashboard h2,
.admin-dashboard h2 {
  letter-spacing: -0.025em;
  font-weight: 750;
}

/* Muted text */

.text-muted,
.muted,
.subtitle,
.description {
  color: var(--dyp-muted);
}

/* Stat numbers */

.stat-value,
.metric-value,
.points-value {
  font-weight: 800;
  letter-spacing: -0.04em;
}

/* Progress bars */

.progress,
.progress-bar,
[role="progressbar"] {
  border-radius: 999px;
  overflow: hidden;
}

.progress-bar,
.progress > div,
[role="progressbar"] > div {
  background: var(--dyp-gradient);
}

/* Inputs */

input,
textarea,
select {
  background: rgba(15, 27, 45, 0.9);
  color: var(--dyp-text);
  border: 1px solid var(--dyp-border);
  border-radius: 12px;
  outline: none;
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease;
}

input:focus,
textarea:focus,
select:focus {
  border-color: rgba(167, 139, 250, 0.65);
  box-shadow:
    0 0 0 3px rgba(124, 58, 237, 0.14);
}

/* Tables */

table {
  border-collapse: separate;
  border-spacing: 0;
}

thead {
  background: rgba(255, 255, 255, 0.025);
}

th {
  color: var(--dyp-muted);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

td,
th {
  border-bottom: 1px solid var(--dyp-border);
}

/* Badges */

.badge,
.status-badge,
.tag {
  border-radius: 999px;
  font-weight: 650;
}

/* Links */

a {
  transition: color 150ms ease;
}

a:hover {
  color: var(--dyp-primary-light);
}

/* Scrollbar */

* {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.28) transparent;
}

*::-webkit-scrollbar {
  width: 7px;
  height: 7px;
}

*::-webkit-scrollbar-track {
  background: transparent;
}

*::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.28);
  border-radius: 999px;
}

/* Responsive dashboard grids */

.dashboard-grid,
.stats-grid,
.card-grid {
  gap: 18px;
}

@media (max-width: 768px) {
  .dashboard-card,
  .stat-card,
  .card,
  .panel,
  .dashboard-panel {
    border-radius: 16px;
  }
}

/* Smooth page entrance */

.dashboard,
.dashboard-page,
.player-dashboard,
.admin-dashboard {
  animation: dypPageEnter 350ms ease both;
}

@keyframes dypPageEnter {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
"""

style_path = ROOT / "styles" / "dyp-ui-override.css"
style_path.write_text(css)
print(f"Created {style_path}")

# ------------------------------------------------------------
# 2. Import the new UI layer
# ------------------------------------------------------------

index_css = ROOT / "styles" / "index.css"

if index_css.exists():
    text = index_css.read_text()

    import_line = '@import "./dyp-ui-override.css";'

    if import_line not in text:
        text += f"\n{import_line}\n"
        index_css.write_text(text)
        print(f"Updated {index_css}")
    else:
        print(f"{index_css} already imports dyp-ui-override.css")
else:
    print(f"WARNING: {index_css} does not exist")

print()
print("Dashboard UI update complete.")
print()
print("Next:")
print("  cd frontend")
print("  npm run build")
