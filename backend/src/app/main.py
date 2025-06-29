from fastapi import FastAPI
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware

from app.api.main import api_router
from app.core.config import get_settings, Settings


from app.core.log_setup import get_logger # <-- Импортируем

# ВЫЗЫВАЕМ ЭТО ОДИН РАЗ ЗДЕСЬ.
# Этот вызов выполнит настройку в LoggingManager
# до того, как uvicorn начнет использовать InterceptHandler.
logger = get_logger()

settings: Settings = get_settings()


def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,
)

# Set all CORS enabled origins
if settings.all_cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.all_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)


# # src/main.py
# from fastapi import FastAPI
# from contextlib import asynccontextmanager
#
# from app.core.config import get_settings
# from app.core.db import get_db_manager
# from app.core.logging import setup_app_logging # <-- импортируем
#
# # Вызываем настройку логирования один раз при старте
# # до создания FastAPI приложения.
# setup_app_logging(settings=get_settings())
#
# db_manager = get_db_manager()
#
# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     await db_manager.connect_to_database()
#     yield
#     await db_manager.close_database_connection()
#
# app = FastAPI(lifespan=lifespan)
#
# # ... остальной код