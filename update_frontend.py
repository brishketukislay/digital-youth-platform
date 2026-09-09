from pathlib import Path
import subprocess
import sys

ROOT = Path.home() / "digital-youth-platform"
FRONTEND = ROOT / "frontend"

if not FRONTEND.exists():
    print(f"❌ Frontend directory not found: {FRONTEND}")
    sys.exit(1)

print("📁 Project:", ROOT)
print("📁 Frontend:", FRONTEND)

# ---------------------------------------------------------
# Update Leaderboard.tsx
# ---------------------------------------------------------

leaderboard = FRONTEND / "src/pages/Leaderboard.tsx"

if not leaderboard.exists():
    print(f"❌ File not found: {leaderboard}")
    sys.exit(1)

source = leaderboard.read_text()

print("✏️ Updating Leaderboard.tsx...")

# Make the public dashboard / leaderboard visually richer
# while preserving the existing API/data logic.

source = source.replace(
    '<main className="public-dashboard">',
    '''<main className="public-dashboard public-dashboard--colourful">'''
)

source = source.replace(
    '<div className="public-panel public-panel--leaderboard">',
    '''<div className="public-panel public-panel--leaderboard public-panel--colourful">'''
)

source = source.replace(
    '<div className="public-panel public-panel--map">',
    '''<div className="public-panel public-panel--map public-panel--colourful">'''
)

leaderboard.write_text(source)

print("✅ Leaderboard.tsx updated")

# ---------------------------------------------------------
# Add colourful theme CSS
# ---------------------------------------------------------

css = FRONTEND / "src/styles/dyp-modern.css"

if not css.exists():
    print(f"⚠️ CSS file not found: {css}")
else:
    existing = css.read_text()

    marker = "/* DIGITAL YOUTH COLOURFUL PUBLIC THEME */"

    if marker not in existing:
        theme_css = r'''

/* DIGITAL YOUTH COLOURFUL PUBLIC THEME */

.public-dashboard--colourful {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at 8% 12%, rgba(99, 102, 241, 0.20), transparent 28%),
    radial-gradient(circle at 92% 18%, rgba(236, 72, 153, 0.16), transparent 25%),
    radial-gradient(circle at 80% 90%, rgba(245, 158, 11, 0.14), transparent 30%),
    #09090b;
  color: #fff;
}

.public-dashboard--colourful::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: .18;
  background-image:
    linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px);
  background-size: 32px 32px;
}

.public-dashboard--colourful .public-header {
  position: relative;
  z-index: 2;
}

.public-dashboard--colourful .public-hero {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(99,102,241,.35);
  background:
    linear-gradient(
      135deg,
      rgba(79,70,229,.22),
      rgba(236,72,153,.10) 48%,
      rgba(245,158,11,.12)
    ),
    rgba(24,24,27,.72);
  box-shadow:
    0 24px 80px rgba(79,70,229,.14),
    inset 0 1px rgba(255,255,255,.06);
  backdrop-filter: blur(18px);
}

.public-dashboard--colourful .public-hero::after {
  content: "";
  position: absolute;
  width: 320px;
  height: 320px;
  right: -100px;
  top: -140px;
  border-radius: 999px;
  background: rgba(245,158,11,.18);
  filter: blur(70px);
}

.public-dashboard--colourful .public-kicker {
  color: #34d399;
}

.public-dashboard--colourful .public-hero h1 {
  letter-spacing: -.055em;
}

.public-dashboard--colourful .public-hero h1 strong {
  background: linear-gradient(
    90deg,
    #818cf8,
    #ec4899,
    #f59e0b
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.public-dashboard--colourful .public-xp {
  border: 1px solid rgba(245,158,11,.30);
  background: rgba(9,9,11,.62);
  box-shadow: 0 0 50px rgba(245,158,11,.10);
}

.public-dashboard--colourful .public-xp strong {
  background: linear-gradient(
    90deg,
    #fbbf24,
    #fb7185,
    #a78bfa
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.public-dashboard--colourful .public-progress-card {
  border: 1px solid rgba(99,102,241,.25);
  background: linear-gradient(
    135deg,
    rgba(24,24,27,.82),
    rgba(39,39,42,.62)
  );
  box-shadow: 0 18px 60px rgba(0,0,0,.22);
  backdrop-filter: blur(18px);
}

.public-dashboard--colourful .public-progress__fill {
  background: linear-gradient(
    90deg,
    #6366f1,
    #ec4899,
    #f59e0b,
    #34d399
  );
  box-shadow:
    0 0 22px rgba(236,72,153,.35),
    0 0 40px rgba(245,158,11,.20);
}

.public-dashboard--colourful .public-panel,
.public-dashboard--colourful .public-phase {
  border: 1px solid rgba(255,255,255,.09);
  background:
    linear-gradient(
      145deg,
      rgba(39,39,42,.72),
      rgba(24,24,27,.70)
    );
  box-shadow:
    0 20px 70px rgba(0,0,0,.20),
    inset 0 1px rgba(255,255,255,.045);
  backdrop-filter: blur(18px);
}

.public-dashboard--colourful .public-panel--leaderboard {
  box-shadow:
    0 20px 70px rgba(99,102,241,.10),
    inset 0 1px rgba(255,255,255,.05);
}

.public-dashboard--colourful .public-panel--map {
  box-shadow:
    0 20px 70px rgba(16,185,129,.08),
    inset 0 1px rgba(255,255,255,.05);
}

.public-dashboard--colourful .public-ranking {
  border: 1px solid rgba(255,255,255,.07);
  background: rgba(9,9,11,.48);
  transition:
    transform .2s ease,
    border-color .2s ease,
    background .2s ease;
}

.public-dashboard--colourful .public-ranking:hover {
  transform: translateY(-2px);
  border-color: rgba(129,140,248,.40);
  background: rgba(49,46,129,.16);
}

.public-dashboard--colourful .public-ranking--1 {
  border-color: rgba(245,158,11,.32);
  background:
    linear-gradient(
      90deg,
      rgba(245,158,11,.12),
      rgba(9,9,11,.42)
    );
}

.public-dashboard--colourful .public-ranking--2 {
  border-color: rgba(148,163,184,.28);
}

.public-dashboard--colourful .public-ranking--3 {
  border-color: rgba(251,146,60,.28);
}

.public-dashboard--colourful .public-ranking__xp {
  background: linear-gradient(
    90deg,
    #fbbf24,
    #fb7185,
    #a78bfa
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.public-dashboard--colourful .public-map {
  border: 1px solid rgba(99,102,241,.22);
  background-color: #111113;
  box-shadow: inset 0 0 80px rgba(79,70,229,.10);
}

.public-dashboard--colourful .public-map__pin {
  filter: drop-shadow(0 0 14px rgba(99,102,241,.55));
}

.public-dashboard--colourful .public-map__pin > span {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 2px solid #a5b4fc;
  border-radius: 999px;
  background: linear-gradient(
    135deg,
    #6366f1,
    #8b5cf6
  );
  box-shadow:
    0 0 18px rgba(99,102,241,.60),
    0 0 40px rgba(236,72,153,.18);
}

.public-dashboard--colourful .public-phase {
  position: relative;
  overflow: hidden;
}

.public-dashboard--colourful .public-phase::after {
  content: "";
  position: absolute;
  width: 140px;
  height: 140px;
  right: -60px;
  bottom: -70px;
  border-radius: 999px;
  background: var(--phase-colour, #6366f1);
  opacity: .15;
  filter: blur(35px);
}

.public-dashboard--colourful .public-live,
.public-dashboard--colourful .public-panel__live {
  border-color: rgba(52,211,153,.30);
  color: #6ee7b7;
  background: rgba(16,185,129,.08);
}

.public-dashboard--colourful .public-live span,
.public-dashboard--colourful .public-panel__live::before {
  box-shadow: 0 0 12px rgba(52,211,153,.8);
}

.public-dashboard--colourful .eyebrow {
  color: #a5b4fc;
}

.public-dashboard--colourful .public-footer {
  border-color: rgba(255,255,255,.08);
}
'''

        css_path = css
        css = css_path.read_text()
        css += "\n" + theme_css
        css_path.write_text(css)
        css.write_text(css)
        print("🎨 Added colourful public dashboard theme")
    else:
        print("ℹ️ Colourful theme CSS already exists")

# ---------------------------------------------------------
# Build frontend
# ---------------------------------------------------------

print()
print("🔨 Running frontend build...")
print()

package_json = FRONTEND / "package.json"

if not package_json.exists():
    print()
    print(f"❌ Could not find package.json at:")
    print(f"   {package_json}")
    print()
    print("Check that the frontend directory is correct.")
    sys.exit(1)

print(f"📦 package.json: {package_json}")
print(f"📁 Build directory: {FRONTEND}")
print()

result = subprocess.run(
    ["npm", "run", "build"],
    cwd=str(FRONTEND),
)

if result.returncode != 0:
    print()
    print("❌ Build failed.")
    print()
    print("Try:")
    print("  cd ~/digital-youth-platform/frontend")
    print("  npm install")
    print("  npm run build")
    sys.exit(result.returncode)

print()
print("========================================")
print("✅ FRONTEND BUILD SUCCESSFUL")
print("========================================")
print()
print("Project:")
print(ROOT)
print()
print("Frontend:")
print(FRONTEND)
print()
print("You can now run your normal frontend command from:")
print()
print("  cd ~/digital-youth-platform/frontend")
print()
