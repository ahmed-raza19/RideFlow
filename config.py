import os
from pathlib import Path


def _load_dotenv(filename='.env'):
    """Lightweight .env loader without external dependencies."""
    env_path = Path(__file__).resolve().parent / filename
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding='utf-8').splitlines():
        line = raw_line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        # Keep explicitly exported shell values if they already exist.
        os.environ.setdefault(key, value)


def _to_bool(value, default=False):
    if value is None:
        return default
    return str(value).strip().lower() in ('1', 'true', 'yes', 'on')


_load_dotenv()

# Database connection settings (read from environment/.env).
DB_CONFIG = {
    'host': os.getenv('MYSQL_HOST', 'localhost'),
    'user': os.getenv('MYSQL_USER', 'root'),
    'password': os.getenv('MYSQL_PASSWORD', ''),
    'database': os.getenv('MYSQL_DATABASE', 'rideflow'),
    'charset': os.getenv('MYSQL_CHARSET', 'utf8mb4'),
    'autocommit': _to_bool(os.getenv('MYSQL_AUTOCOMMIT'), False),
}

SECRET_KEY = os.getenv('SECRET_KEY', 'rideflow-secret-key-change-in-production-2026')

