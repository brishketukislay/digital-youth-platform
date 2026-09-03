# Digital Youth Platform

React + TypeScript + FastAPI + SQLite.

## First run

Backend:

cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload

In another terminal:

cd frontend
npm install
npm run dev

Open:

http://localhost:5173

## Initial accounts

Admin:
admin / ChangeMe123!

Youth worker:
youthworker / ChangeMe123!

Player:
player01 / ChangeMe123!

Change these passwords before using the application with real participants.

## Public leaderboard

http://localhost:5173/leaderboard
