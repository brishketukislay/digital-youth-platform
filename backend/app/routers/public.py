from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Programme, Phase, Theme, Map, MapLocation
from ..services.xp import group_xp

router = APIRouter(prefix="/api/public", tags=["public"])


@router.get("/dashboard")
def public_dashboard(db: Session = Depends(get_db)):
    programme = db.query(Programme).filter(
        Programme.active == True
    ).first()

    if not programme:
        return {
            "programme": None,
            "group_xp": 0,
        }

    theme = db.get(Theme, programme.theme_id) if programme.theme_id else None
    game_map = db.get(Map, programme.map_id) if programme.map_id else None

    phases = db.query(Phase).filter(
        Phase.programme_id == programme.id,
        Phase.active == True,
    ).order_by(Phase.sort_order).all()

    locations = []

    if game_map:
        locations = db.query(MapLocation).filter(
            MapLocation.map_id == game_map.id,
            MapLocation.active == True,
        ).all()

    return {
        "programme": {
            "name": programme.name,
            "target_xp": programme.target_xp,
        },
        "group_xp": group_xp(db),
        "theme": {
            "primary": theme.primary,
            "secondary": theme.secondary,
            "accent": theme.accent,
            "background": theme.background,
            "surface": theme.surface,
            "text": theme.text,
        } if theme else None,
        "phases": [
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "colour": p.colour,
                "icon": p.icon,
            }
            for p in phases
        ],
        "map": {
            "name": game_map.name,
            "background_image": game_map.background_image,
            "locations": [
                {
                    "id": l.id,
                    "name": l.name,
                    "x": l.x,
                    "y": l.y,
                    "icon": l.icon,
                }
                for l in locations
            ],
        } if game_map else None,
    }
