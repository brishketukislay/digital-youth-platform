from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    Player,
    Programme,
    Theme,
    Map,
    MapLocation,
    Phase,
    PhaseLocation,
    Badge,
    SkillTree,
    SkillMilestone,
    Challenge,
    Resource,
)
from ..auth import require_roles
from ..services.xp import player_xp, group_xp

router = APIRouter(prefix="/api/player", tags=["player"])


@router.get("/dashboard")
def dashboard(
    user=Depends(require_roles("player")),
    db: Session = Depends(get_db),
):
    player = db.query(Player).filter(Player.user_id == user.id).first()

    if not player:
        return {"player": None}

    programme = db.query(Programme).filter(Programme.active == True).first()

    theme = db.get(Theme, programme.theme_id) if programme and programme.theme_id else None
    game_map = db.get(Map, programme.map_id) if programme and programme.map_id else None

    phases = []
    if programme:
        phases = db.query(Phase).filter(
            Phase.programme_id == programme.id,
            Phase.active == True,
        ).order_by(Phase.sort_order).all()

    current_phase = phases[0] if phases else None

    locations = []
    if game_map:
        locations = db.query(MapLocation).filter(
            MapLocation.map_id == game_map.id,
            MapLocation.active == True,
        ).all()

    badges = db.query(Badge).filter(Badge.player_id == player.id).all()
    skill = db.query(SkillTree).filter(
        SkillTree.player_id == player.id,
        SkillTree.active == True,
    ).first()

    milestones = []
    if skill:
        milestones = db.query(SkillMilestone).filter(
            SkillMilestone.skill_tree_id == skill.id
        ).all()

    challenges = db.query(Challenge).filter(
        Challenge.active == True
    ).all()

    return {
        "player": {
            "id": player.id,
            "gamertag": player.gamertag,
            "avatar": player.avatar,
            "xp": player_xp(db, player.id),
        },
        "group_xp": group_xp(db),
        "target_xp": programme.target_xp if programme else 1500000,
        "programme": {
            "name": programme.name if programme else "Youth Challenge",
        },
        "theme": {
            "primary": theme.primary,
            "secondary": theme.secondary,
            "accent": theme.accent,
            "background": theme.background,
            "surface": theme.surface,
            "text": theme.text,
        } if theme else None,
        "map": {
            "name": game_map.name,
            "background_image": game_map.background_image,
            "locations": [
                {
                    "id": x.id,
                    "name": x.name,
                    "x": x.x,
                    "y": x.y,
                    "icon": x.icon,
                }
                for x in locations
            ],
        } if game_map else None,
        "phase": {
            "id": current_phase.id,
            "name": current_phase.name,
            "description": current_phase.description,
            "colour": current_phase.colour,
            "icon": current_phase.icon,
        } if current_phase else None,
        "badges": [
            {
                "name": b.name,
                "description": b.description,
                "colour": b.colour,
            }
            for b in badges
        ],
        "skill_tree": {
            "name": skill.name,
            "description": skill.description,
            "xp": skill.current_xp,
            "milestones": [
                {
                    "name": m.name,
                    "required_xp": m.required_xp,
                    "completed": m.completed,
                    "reward": m.reward_description,
                }
                for m in milestones
            ],
        } if skill else None,
        "challenges": [
            {
                "id": c.id,
                "title": c.title,
                "description": c.description,
                "participation_xp": c.participation_xp,
                "elite_xp": c.elite_xp,
                "winner_xp": c.winner_xp,
            }
            for c in challenges
        ],
    }
