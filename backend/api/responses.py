"""Error envelopes expected by the existing frontend API client."""

from fastapi.responses import JSONResponse


def error(message: str, status_code: int, *, legacy: bool = False) -> JSONResponse:
    body = {'error': message} if legacy else {'status': 'error', 'message': message}
    return JSONResponse(status_code=status_code, content=body)
