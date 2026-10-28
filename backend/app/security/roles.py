from fastapi import Depends, HTTPException

from app.security.dependencies import get_current_user


def require_manager(
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "Manager":
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    return current_user