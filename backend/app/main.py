from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import Base, engine
from .routers import (
    admin,
    attendance,
    auth,
    leaderboard,
    player,
    public,
)


app = FastAPI(
    title="Digital Youth Platform",
    version="2.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(player.router)
app.include_router(leaderboard.router)
app.include_router(attendance.router)
app.include_router(admin.router)
app.include_router(public.router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


frontend = (
    Path(__file__).resolve().parents[2]
    / "frontend"
    / "dist"
)

if frontend.exists():
    app.mount(
        "/",
        StaticFiles(
            directory=frontend,
            html=True,
        ),
        name="frontend",
    )
