"""Module for configuring logging in the application."""

import logging
from functools import lru_cache
from pathlib import Path
from sys import stderr

from loguru import logger

# noinspection PyProtectedMember
from loguru._logger import Logger

from app.core.config import get_settings, Settings

__all__: tuple[str, ...] = ("get_logger", "InterceptHandler")


class LoggingManager:
    """Performs logging settings in the application."""

    def __init__(self, settings: Settings) -> None:
        """
        Initializes the logging manager.

        :param settings: Settings instance.
        """
        self._settings: Settings = settings
        self.logger: Logger = logger
        self.logger.remove()
        debug: bool = self._settings.ENVIRONMENT == "local"
        # Forming the log format
        time_format: str = "<green>{time:YYYY-MM-DD HH:mm:ss}</green>"
        level_format: str = "<level>{level: <8}</level>"
        # Add detailed information only in DEBUG mode
        debug_info_format: str = "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | " if debug else ""
        message_format: str = "<level>{message}</level>"
        # Assembling the final format for the console
        console_format: str = f"{time_format} | {level_format} | {debug_info_format}{message_format}"
        # Determine the logging level depending on the mode
        log_level: int = logging.DEBUG if debug else logging.INFO
        # Configuring the 'receiver' for the console
        logger.add(sink=stderr, level=log_level, format=console_format, colorize=True)
        # Configuring the 'receiver' for the file
        log_dir: Path = Path(self._settings.BASE_DIR, "logs")
        log_dir.mkdir(exist_ok=True)
        logger.add(
            sink=Path(log_dir, f"{self._settings.PROJECT_NAME.replace(' ', '_').lower()}.log"),
            level=log_level,
            format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} | {message}",
            encoding="utf-8",
            enqueue=True,  # Makes logging asynchronous
            backtrace=True,
        )


class InterceptHandler(logging.Handler):
    """Intercepts standard logging messages and redirects them to Loguru."""

    def emit(self, record: logging.LogRecord) -> None:
        """
        Redirects a standard logging message to Loguru.

        :param record: Standard logging record.
        :return: None
        """
        try:
            level: str | int = logger.level(name=record.levelname).name
        except ValueError:
            level = record.levelno
        frame, depth = logging.currentframe(), 2
        while frame and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1
        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())


@lru_cache(maxsize=1)
def get_logger() -> Logger:
    """
    Gets the Logger object. The lru_cache decorator ensures this function is only called once.

    :return: An instance of Logger.
    """
    LoggingManager(settings=get_settings())
    return logger
