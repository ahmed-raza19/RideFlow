# ── Database connection settings ─────────────────────────────
# Change MYSQL_PASSWORD to your local MySQL root password before running.
DB_CONFIG = {
    'host':     'localhost',
    'user':     'root',
    'password': '',   # <── PUT YOUR MYSQL ROOT PASSWORD HERE (e.g., 'root' or 'mysql123')
    'database': 'rideflow',
    'charset':  'utf8mb4',
    'autocommit': False,
}

SECRET_KEY = 'rideflow-secret-key-change-in-production-2026'

# ── Demo login rule ───────────────────────────────────────────
# Password = user's first name (case-insensitive).
# e.g.  ali.raza@rideflow.pk  / ali   → Admin
#        sara.ahmed@gmail.com  / sara  → Rider
#        bilal.driver@gmail.com / bilal → Driver
