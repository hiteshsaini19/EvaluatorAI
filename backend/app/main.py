import os
import uvicorn
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.database import engine
from app.routes import auth, roles, users, subjects, questions, test, candidates, public

# The schema is managed only by Alembic migrations: run `alembic upgrade head` before starting.

app = FastAPI(title="EvaluatorAI API")

ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Local development
    "https://interview-test-platform-front-end.vercel.app",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Specific origins only
    allow_credentials=True,  # Required for cookies/auth
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Handle Pydantic validation errors - Custom
    errors = exc.errors()

    # Check if it's a JSON decode error (malformed JSON like {"password":})
    if errors and errors[0].get("type") == "json_invalid":
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "status": 422,
                "error": "Invalid JSON format. Please check your request body."
            }
        )

    # Handle missing required fields
    if errors and errors[0].get("type") == "missing":
        missing_field = errors[0].get("loc")[-1]  # Get field name
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "status": 422,
                "error": f"{missing_field} is a required field"
            }
        )

    # Handle length, range and format failures with the real reason
    if errors and errors[0].get("type") in [
        "string_too_short", "string_too_long", "value_error",
        "greater_than_equal", "less_than_equal", "enum", "int_parsing", "datetime_from_date_parsing",
        "datetime_parsing",
    ]:
        error = errors[0]
        # The last named part of the location (list items add an index, e.g. difficulties.0)
        field_name = next((part for part in reversed(error.get("loc") or []) if isinstance(part, str)), "value")
        ctx = error.get("ctx") or {}

        if error["type"] == "greater_than_equal":
            message = f"{field_name} must be at least {ctx.get('ge')}"
        elif error["type"] == "less_than_equal":
            message = f"{field_name} must be at most {ctx.get('le')}"
        elif error["type"] == "enum":
            message = f"{field_name} must be one of {ctx.get('expected')}"
        elif error["type"] == "int_parsing":
            message = f"{field_name} must be a whole number"
        elif error["type"] in ("datetime_parsing", "datetime_from_date_parsing"):
            message = f"{field_name} must be a valid date and time"
        elif error["type"] == "string_too_short":
            min_length = ctx.get("min_length", 1)
            message = (f"{field_name} cannot be empty" if min_length <= 1
                       else f"{field_name} must be at least {min_length} characters")
        elif error["type"] == "string_too_long":
            message = f"{field_name} must be at most {ctx.get('max_length')} characters"
        elif field_name == "email":
            message = "Please enter a valid email address"
        else:
            # Custom validators raise ValueError("..."); pydantic prefixes it with "Value error, "
            message = error.get("msg", "").removeprefix("Value error, ") or f"{field_name} is invalid"

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "status": 422,
                "error": message
            }
        )

    # Generic validation error (type mismatches, etc.)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "status": 422,
            "error": "Validation error",
            "details": errors
        }
    )


app.include_router(auth.router)
app.include_router(roles.router)
app.include_router(users.router)
app.include_router(subjects.router)
app.include_router(questions.router)
app.include_router(test.router)
app.include_router(candidates.router)
app.include_router(public.router)

@app.get("/")
def read_root():
    return {"status" : "ok", "message" : "EvaluatorAI API - dev server" }

class HelloIn(BaseModel):
    name: str

class HelloOut(BaseModel):
    greeting: str

@app.post("/hello", response_model= HelloOut)
def say_hello(payload: HelloIn):
    return {"greeting": f"Hello, {payload.name}! This endpoint works."}

from app.database import engine
@app.get("/test-db")
def test_db_connnection():
    try:
        with engine.connect () as conn:
            return {"status": "sucess", "message": "Database connection Ok"}
        
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 10000))  # defaults to 10000
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        proxy_headers=True,
        forwarded_allow_ips="*"
    )
    
if __name__ == "__main__":

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port
    )