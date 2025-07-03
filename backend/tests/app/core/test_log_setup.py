# type: ignore
"""Unit tests for backend/src/app/core/log_setup.py"""

# pylint: disable=protected-access
# pylint: disable=redefined-outer-name

import logging
from pathlib import Path
from unittest.mock import MagicMock, Mock

import pytest

# noinspection PyProtectedMember
from loguru._logger import Logger
from pytest_mock import MockerFixture

from app.core.config import Settings

# noinspection PyProtectedMember
from app.core.log_setup import LoggingManager, InterceptHandler, get_logger

__all__: tuple = ()


@pytest.fixture
def mock_settings(mocker: MockerFixture) -> Settings:
    """
    Mocks the Settings object for testing.

    :param mocker: Pytest-mock fixture for mocking.
    :return: Mocked Settings object.
    """
    settings: Settings = mocker.create_autospec(spec=Settings, instance=True)
    settings.ENVIRONMENT = "local"
    settings.BASE_DIR = Path("/mocked/path")
    settings.PROJECT_NAME = "Test Project"
    return settings


@pytest.fixture
def mock_logger(mocker: MockerFixture) -> Logger:
    """
    Mocks the Loguru Logger object for testing.

    :param mocker: Pytest-mock fixture for mocking.
    :return: Mocked Logger object.
    """
    logger: Logger = mocker.create_autospec(spec=Logger, instance=True)
    logger.level.return_value = mocker.Mock(name="DEBUG")
    logger.opt.return_value = logger
    return logger


# noinspection PyUnresolvedReferences
def test_logging_manager_init_local(mock_settings: Settings, mock_logger: Logger, mocker: MockerFixture) -> None:
    """
    Tests the initialization of the LoggingManager class in local environment.

    :param mock_settings: Mocked Settings object.
    :param mock_logger: Mocked Logger object.
    :param mocker: Pytest-mock fixture for mocking.
    :return: None
    """
    mock_settings.ENVIRONMENT = "local"
    mock_path: MagicMock = mocker.patch(target="app.core.log_setup.Path")
    mock_log_dir: Mock = mocker.Mock(spec=Path)
    mock_log_file: Mock = mocker.Mock(spec=Path)
    mock_path.side_effect = [mock_log_dir, mock_log_file]
    mock_log_dir.mkdir.return_value = None
    mocker.patch(target="app.core.log_setup.logger", new=mock_logger)
    logging_manager: LoggingManager = LoggingManager(settings=mock_settings)
    assert logging_manager._settings == mock_settings
    assert logging_manager.logger == mock_logger
    mock_logger.remove.assert_called_once()
    mock_logger.add.assert_any_call(
        sink=mocker.ANY,  # stderr
        level=logging.DEBUG,
        format=(
            "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | <level>{message}</level>"
        ),
        colorize=True,
    )
    mock_logger.add.assert_any_call(
        sink=mock_log_file,
        level=logging.DEBUG,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} | {message}",
        encoding="utf-8",
        enqueue=True,
        backtrace=True,
    )
    mock_log_dir.mkdir.assert_called_once_with(exist_ok=True)


# noinspection PyUnresolvedReferences
def test_logging_manager_init_non_local(mock_settings: Settings, mock_logger: Logger, mocker: MockerFixture) -> None:
    """
    Tests the initialization of the LoggingManager class in non-local environment.

    :param mock_settings: Mocked Settings object.
    :param mock_logger: Mocked Logger object.
    :param mocker: Pytest-mock fixture for mocking.
    :return: None
    """
    mock_settings.ENVIRONMENT = "production"
    mock_path: MagicMock = mocker.patch(target="app.core.log_setup.Path")
    mock_log_dir: Mock = mocker.Mock(spec=Path)
    mock_log_file: Mock = mocker.Mock(spec=Path)
    mock_path.side_effect = [mock_log_dir, mock_log_file]
    mock_log_dir.mkdir.return_value = None
    mocker.patch(target="app.core.log_setup.logger", new=mock_logger)
    logging_manager: LoggingManager = LoggingManager(settings=mock_settings)
    assert logging_manager._settings == mock_settings
    assert logging_manager.logger == mock_logger
    mock_logger.remove.assert_called_once()
    mock_logger.add.assert_any_call(
        sink=mocker.ANY,  # stderr
        level=logging.INFO,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>",
        colorize=True,
    )
    mock_logger.add.assert_any_call(
        sink=mock_log_file,
        level=logging.INFO,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} | {message}",
        encoding="utf-8",
        enqueue=True,
        backtrace=True,
    )
    mock_log_dir.mkdir.assert_called_once_with(exist_ok=True)


# noinspection PyUnresolvedReferences
@pytest.mark.parametrize(
    argnames="level_name,level_no,expected_level",
    argvalues=[("DEBUG", 10, "DEBUG"), ("INFO", 20, "INFO"), ("UNKNOWN", 999, 999)],
    ids=["known_level", "info_level", "unknown_level"],
)
def test_intercept_handler_emit(
    level_name: str, level_no: int, expected_level: str | int, mock_logger: Logger, mocker: MockerFixture
) -> None:
    """
    Tests the emit method of the InterceptHandler class.

    :param level_name: The name of the logging level.
    :param level_no: The numeric value of the logging level.
    :param expected_level: The expected level passed to logger.log.
    :param mock_logger: Mocked Logger object.
    :param mocker: Pytest-mock fixture for mocking.
    :return: None
    """
    mocker.patch(target="app.core.log_setup.logger", new=mock_logger)
    mock_record: logging.LogRecord = mocker.create_autospec(spec=logging.LogRecord, instance=True)
    mock_record.levelname = level_name
    mock_record.levelno = level_no
    mock_record.getMessage.return_value = "Test message"
    mock_record.exc_info = None
    mock_frame: Mock = mocker.Mock()
    mock_frame.f_code.co_filename = "some_file.py"
    mocker.patch(target="app.core.log_setup.logging.currentframe", return_value=mock_frame)
    if level_name == "UNKNOWN":
        mock_logger.level.side_effect = ValueError
    else:
        mock_logger.level.return_value.name = level_name
    handler: InterceptHandler = InterceptHandler()
    handler.emit(record=mock_record)
    mock_logger.opt.return_value.log.assert_called_once_with(expected_level, "Test message")


# noinspection PyUnresolvedReferences
def test_intercept_handler_emit_logging_frame(mock_logger: Logger, mocker: MockerFixture) -> None:
    """
    Tests the emit method of the InterceptHandler class when frame is from logging module.

    :param mock_logger: Mocked Logger object.
    :param mocker: Pytest-mock fixture for mocking.
    :return: None
    """
    mocker.patch(target="app.core.log_setup.logger", new=mock_logger)
    mock_record: logging.LogRecord = mocker.create_autospec(spec=logging.LogRecord, instance=True)
    mock_record.levelname = "INFO"
    mock_record.levelno = 20
    mock_record.getMessage.return_value = "Test message"
    mock_record.exc_info = None
    mock_frame1: Mock = mocker.Mock()
    mock_frame1.f_code.co_filename = logging.__file__
    mock_frame2: Mock = mocker.Mock()
    mock_frame2.f_code.co_filename = "some_file.py"
    mock_frame1.f_back = mock_frame2
    mocker.patch(target="app.core.log_setup.logging.currentframe", return_value=mock_frame1)
    mock_logger.level.return_value.name = "INFO"
    handler: InterceptHandler = InterceptHandler()
    handler.emit(record=mock_record)
    mock_logger.opt.assert_called_once_with(depth=3, exception=None)
    mock_logger.opt.return_value.log.assert_called_once_with("INFO", "Test message")


def test_get_logger_caching(mock_settings: Settings, mock_logger: Logger, mocker: MockerFixture) -> None:
    """
    Tests the get_logger function caching with lru_cache.

    :param mock_settings: Mocked Settings object.
    :param mock_logger: Mocked Logger object.
    :param mocker: Pytest-mock fixture for mocking.
    :return: None
    """
    mocker.patch(target="app.core.log_setup.get_settings", return_value=mock_settings)
    mocker.patch(target="app.core.log_setup.logger", new=mock_logger)
    mocker.patch(target="app.core.log_setup.Path")
    logger1: Logger = get_logger()
    logger2: Logger = get_logger()
    assert logger1 is logger2
