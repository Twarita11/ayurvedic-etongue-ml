from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from ..utils.codegen import generate_client_code

router = APIRouter()

@router.post("/client/{factory}/{medicine}/{client_type}")
async def generate_client(
    factory: str,
    medicine: str,
    client_type: str,
    settings: Dict[str, Any]
) -> Dict[str, str]:
    """Generate client code for specific factory and medicine."""
    try:
        api_url = settings.get("api_url", "http://localhost:8000")
        code = generate_client_code(factory, medicine, api_url, client_type)
        return {"code": code}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating client code: {str(e)}")