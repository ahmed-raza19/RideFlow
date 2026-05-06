from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import mysql.connector
from functools import wraps
from config import DB_CONFIG, SECRET_KEY
from datetime import datetime
from decimal import Decimal
import re
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = SECRET_KEY

# ── DB helpers ────────────────────────────────────────────────
def get_db():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        conn.autocommit = False
        return conn
    except Exception as e:
        print(f"DB Error: {e}")
        return None

def qry(sql, params=(), one=False, commit=False):
    conn = get_db()
    if not conn:
        return None
    cur = None
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(sql, params)
        if commit:
            conn.commit()
            return cur.rowcount
        result = cur.fetchone() if one else cur.fetchall()
        return result
    except Exception as e:
        if commit:
            try: conn.rollback()
            except: pass
        raise e
    finally:
        if cur:
            try: cur.close()
            except: pass
        try: conn.close()
        except: pass

def call_proc(name, args=()):
    """Call a stored procedure, return list of result-set rows."""
    conn = get_db()
    if not conn:
        return []
    try:
        cur = conn.cursor(dictionary=True)
        cur.callproc(name, args)
        results = []
        for rs in cur.stored_results():
            results.extend(rs.fetchall())
        conn.commit()
        return results
    except Exception as e:
        try: conn.rollback()
        except: pass
        raise e
    finally:
        try: conn.close()
        except: pass

def _serial(v):
    """Make a value JSON-safe."""
    if isinstance(v, datetime):
        return v.strftime('%Y-%m-%d %H:%M')
    if isinstance(v, Decimal):
        return float(v)
    return v

def clean(rows):
    return [{k: _serial(v) for k, v in r.items()} for r in (rows or [])]

def clean1(row):
    if not row: return None
    return {k: _serial(v) for k, v in row.items()}


def _parse_name(full_name):
    parts = [p for p in (full_name or '').strip().split() if p]
    if len(parts) < 2:
        return None, None
    return parts[0], ' '.join(parts[1:])


def _normalize_phone(value):
    raw = (value or '').strip()
    if not raw:
        return ''
    plus = '+' if raw.startswith('+') else ''
    digits = ''.join(ch for ch in raw if ch.isdigit())
    return f"{plus}{digits}"


def _is_valid_email(value):
    return bool(re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', (value or '').strip()))


def _build_auth_payload(user):
    return {
        'id': user['UserID'],
        'name': f"{user['FirstName']} {user['LastName']}",
        'email': user['Email'],
        'role': user['Role'].lower(),
    }


def _find_active_user_by_identity(identity):
    identity = (identity or '').strip()
    if not identity:
        return None

    if _is_valid_email(identity):
        return qry("SELECT * FROM USERS WHERE Email=%s AND AccountStatus='Active'", (identity,), one=True)

    norm = _normalize_phone(identity)
    if not norm:
        return None
    rows = qry("""
        SELECT u.*, p.PhoneNumber
        FROM USERS u
        JOIN USER_PHONES p ON p.UserID=u.UserID
        WHERE u.AccountStatus='Active'
    """) or []
    for row in rows:
        if _normalize_phone(row.get('PhoneNumber')) == norm:
            user = dict(row)
            user.pop('PhoneNumber', None)
            return user
    return None


def _verify_password(user, password):
    stored = user.get('Password') or ''
    if stored.startswith('pbkdf2:') or stored.startswith('scrypt:'):
        return check_password_hash(stored, password)
    # Compatibility path for legacy seeded data in this educational project.
    return password.lower() == (user.get('FirstName') or '').lower()


def _set_auth_session(user):
    session.permanent = True
    session['user_id'] = user['UserID']
    session['user_name'] = f"{user['FirstName']} {user['LastName']}"
    session['role'] = user['Role']
    session['email'] = user['Email']

# ── Auth ───────────────────────────────────────────────────────
def role_required(*roles):
    def deco(f):
        @wraps(f)
        def decorated(*a, **kw):
            if 'user_id' not in session or session.get('role') not in roles:
                if request.path.startswith('/api/'):
                    return jsonify({'error': 'Unauthorized'}), 401
                return redirect(url_for('login_page'))
            return f(*a, **kw)
        return decorated
    return deco

# ── Pages ──────────────────────────────────────────────────────
@app.route('/')
def login_page():
    if 'user_id' in session:
        return redirect({'Admin':'/admin','Rider':'/rider','Driver':'/driver'}.get(session['role'],'/'))
    return render_template('login.html')

@app.route('/admin')
@role_required('Admin')
def admin_page():
    return render_template('admin_dashboard.html', user=session)

@app.route('/rider')
@role_required('Rider')
def rider_page():
    return render_template('rider_dashboard.html', user=session)

@app.route('/driver')
@role_required('Driver')
def driver_page():
    return render_template('driver_dashboard.html', user=session)

# ── Auth endpoints ─────────────────────────────────────────────
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email    = (data.get('email') or data.get('emailOrPhone') or '').strip()
    password = (data.get('password') or '').strip()
    if not email or not password:
        return jsonify({'error': 'Email/phone and password are required'}), 400
    user = _find_active_user_by_identity(email)
    if not user:
        return jsonify({'error': 'Account not found or suspended'}), 401
    if not _verify_password(user, password):
        return jsonify({'error': 'Invalid password'}), 401
    _set_auth_session(user)
    return jsonify({
        'redirect': {'Admin': '/admin', 'Rider': '/rider', 'Driver': '/driver'}.get(user['Role'], '/'),
        'user': _build_auth_payload(user),
    })


@app.route('/api/auth/login', methods=['POST'])
def api_auth_login():
    return login()


@app.route('/api/auth/signup', methods=['POST'])
def api_auth_signup():
    data = request.get_json() or {}
    full_name = (data.get('full_name') or data.get('fullName') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = (data.get('password') or '').strip()
    country_code = (data.get('country_code') or data.get('countryCode') or '').strip()
    phone = (data.get('phone') or '').strip()
    role = (data.get('role') or 'Rider').strip().title()
    license_number = (data.get('license_number') or data.get('licenseNumber') or '').strip()
    cnic = (data.get('cnic') or '').strip()

    first_name, last_name = _parse_name(full_name)
    if not first_name or not last_name:
        return jsonify({'error': 'Please provide full name (first and last name).'}), 400
    if not _is_valid_email(email):
        return jsonify({'error': 'Please provide a valid email address.'}), 400
    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters.'}), 400
    if role not in ('Rider', 'Driver'):
        return jsonify({'error': 'Role must be Rider or Driver.'}), 400

    normalized_phone = _normalize_phone(f"{country_code}{phone}")
    if len(normalized_phone.replace('+', '')) < 7:
        return jsonify({'error': 'Please provide a valid phone number.'}), 400

    if role == 'Driver' and (not license_number or not cnic):
        return jsonify({'error': 'License number and CNIC are required for drivers.'}), 400

    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database unavailable'}), 503

    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(
            """
            INSERT INTO USERS (FirstName, LastName, Email, Password, Role, AccountStatus)
            VALUES (%s, %s, %s, %s, %s, 'Active')
            """,
            (first_name, last_name, email, generate_password_hash(password), role),
        )
        user_id = cur.lastrowid

        cur.execute(
            "INSERT INTO USER_PHONES (UserID, PhoneNumber) VALUES (%s, %s)",
            (user_id, normalized_phone),
        )

        if role == 'Driver':
            cur.execute(
                """
                INSERT INTO DRIVERS (
                    UserID, LicenseNumber, CNIC, VerificationStatus,
                    AvailabilityStatus, WalletBalance, CommissionRate, CurrentLocationID
                ) VALUES (%s, %s, %s, 'Unverified', 'Offline', 0.00, 10.00, NULL)
                """,
                (user_id, license_number, cnic),
            )

        conn.commit()

        cur.execute("SELECT * FROM USERS WHERE UserID=%s", (user_id,))
        user = cur.fetchone()
        _set_auth_session(user)
        return jsonify({
            'success': True,
            'user': _build_auth_payload(user),
            'redirect': {'Admin': '/admin', 'Rider': '/rider', 'Driver': '/driver'}.get(user['Role'], '/'),
        }), 201
    except mysql.connector.Error as e:
        try:
            conn.rollback()
        except:
            pass
        if getattr(e, 'errno', None) == 1062:
            msg = str(e)
            if 'Email' in msg:
                return jsonify({'error': 'An account with this email already exists.'}), 409
            if 'LicenseNumber' in msg:
                return jsonify({'error': 'This license number is already registered.'}), 409
            if 'CNIC' in msg:
                return jsonify({'error': 'This CNIC is already registered.'}), 409
            return jsonify({'error': 'Duplicate value found. Please check your input.'}), 409
        return jsonify({'error': str(e)}), 500
    finally:
        try:
            conn.close()
        except:
            pass

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login_page'))

# ══════════════════════════════════════════════════════════════
# ADMIN API
# ══════════════════════════════════════════════════════════════
def _cnt(sql):
    row = qry(sql, one=True) or {}
    return int(row.get('c', 0))

@app.route('/api/admin/stats')
@role_required('Admin')
def api_admin_stats():
    rev = qry("SELECT COALESCE(SUM(Amount),0) c FROM PAYMENTS WHERE PaymentStatus='Paid'", one=True) or {}
    return jsonify({
        'total_users':     _cnt("SELECT COUNT(*) c FROM USERS"),
        'active_rides':    _cnt("SELECT COUNT(*) c FROM RIDES WHERE RideStatus='InProgress'"),
        'completed_rides': _cnt("SELECT COUNT(*) c FROM RIDES WHERE RideStatus='Completed'"),
        'revenue':         float(rev.get('c', 0)),
        'open_complaints': _cnt("SELECT COUNT(*) c FROM COMPLAINTS WHERE ComplaintStatus='Open'"),
        'online_drivers':  _cnt("SELECT COUNT(*) c FROM DRIVERS WHERE AvailabilityStatus='Online'"),
    })

@app.route('/api/admin/revenue-city')
@role_required('Admin')
def api_revenue_city():
    rows = qry("SELECT City, SUM(GrossRevenue) g, SUM(NetRevenue) n FROM vw_RevenueByCity GROUP BY City ORDER BY n DESC") or []
    return jsonify([{'city': r['City'], 'gross': float(r['g'] or 0), 'net': float(r['n'] or 0)} for r in rows])

@app.route('/api/admin/revenue-method')
@role_required('Admin')
def api_revenue_method():
    rows = qry("SELECT * FROM vw_RevenueByPaymentMethod") or []
    return jsonify([{'method': r['PaymentMethod'], 'amount': float(r['TotalAmount'] or 0), 'count': int(r['Transactions'])} for r in rows])

@app.route('/api/admin/leaderboard')
@role_required('Admin')
def api_leaderboard():
    rows = qry("SELECT * FROM vw_DriverLeaderboard LIMIT 10") or []
    return jsonify([{'driver': r['DriverName'], 'city': r['City'], 'rating': float(r['AvgRating'] or 0), 'rides': int(r['TotalRides'])} for r in rows])

@app.route('/api/admin/active-rides')
@role_required('Admin')
def api_active_rides():
    return jsonify(clean(qry("SELECT * FROM vw_ActiveRides") or []))

@app.route('/api/admin/complaints')
@role_required('Admin')
def api_complaints():
    rows = qry("""SELECT c.ComplaintID, c.RideID, c.Description, c.ComplaintStatus,
                         c.CreatedAt, CONCAT(u.FirstName,' ',u.LastName) FiledBy
                  FROM COMPLAINTS c JOIN USERS u ON c.UserID=u.UserID
                  ORDER BY c.CreatedAt DESC""") or []
    return jsonify(clean(rows))

@app.route('/api/admin/complaints/<int:cid>/<action>', methods=['POST'])
@role_required('Admin')
def api_complaint_action(cid, action):
    status = {'resolve': 'Resolved', 'dismiss': 'Dismissed'}.get(action)
    if not status:
        return jsonify({'error': 'Invalid action'}), 400
    qry("UPDATE COMPLAINTS SET ComplaintStatus=%s WHERE ComplaintID=%s", (status, cid), commit=True)
    return jsonify({'success': True, 'status': status})

@app.route('/api/admin/vehicles')
@role_required('Admin')
def api_vehicles():
    rows = qry("""SELECT v.VehicleID, v.Make, v.Model, v.VehicleType, v.LicensePlate,
                        v.Year AS YearOfManufacture, v.VerificationStatus,
                        CONCAT(u.FirstName,' ',u.LastName) DriverName
                 FROM VEHICLES v
                 JOIN DRIVERS d ON v.DriverID=d.DriverID
                 JOIN USERS u ON d.UserID=u.UserID
                 ORDER BY v.VehicleID""") or []
    return jsonify([{
        'id': r['VehicleID'], 'driver': r['DriverName'],
        'make': r['Make'], 'model': r['Model'], 'type': r['VehicleType'],
        'plate': r['LicensePlate'], 'year': r['YearOfManufacture'],
        'status': r['VerificationStatus'],
    } for r in rows])

@app.route('/api/admin/top-drivers')
@role_required('Admin')
def api_top_drivers():
    rows = qry("SELECT * FROM vw_TopDrivers") or []
    return jsonify([{
        'driver':   r['DriverName'], 'city': r['City'],
        'rating':   float(r['AvgRating'] or 0),
        'ratings':  int(r['TotalRatings']), 'rides': int(r['TotalRides']),
        'verified': r['VerificationStatus'],
    } for r in rows])

@app.route('/api/admin/users')
@role_required('Admin')
def api_users():
    rows = qry("SELECT UserID,FirstName,LastName,Email,Role,AccountStatus,DATE(RegistrationDate) JoinDate FROM USERS ORDER BY UserID") or []
    return jsonify([{
        'id': r['UserID'], 'name': f"{r['FirstName']} {r['LastName']}",
        'email': r['Email'], 'role': r['Role'],
        'status': r['AccountStatus'], 'joined': str(r['JoinDate'])
    } for r in rows])

@app.route('/api/admin/users/<int:uid>/toggle', methods=['POST'])
@role_required('Admin')
def api_toggle_user(uid):
    if uid == session['user_id']:
        return jsonify({'error': 'Cannot modify your own account'}), 400
    user = qry("SELECT AccountStatus FROM USERS WHERE UserID=%s", (uid,), one=True)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    new = 'Active' if user['AccountStatus'] == 'Suspended' else 'Suspended'
    qry("UPDATE USERS SET AccountStatus=%s WHERE UserID=%s", (new, uid), commit=True)
    return jsonify({'success': True, 'status': new})

# ══════════════════════════════════════════════════════════════
# RIDER API
# ══════════════════════════════════════════════════════════════
@app.route('/api/rider/locations')
@role_required('Rider')
def api_locations():
    rows = qry("SELECT LocationID, COALESCE(LocationName, Street) AS name, City FROM LOCATIONS ORDER BY City") or []
    return jsonify([{'id': r['LocationID'], 'label': f"{r['name']} — {r['City']}"} for r in rows])

@app.route('/api/rider/rides')
@role_required('Rider')
def api_rider_rides():
    uid = session['user_id']
    rows = qry("""
        SELECT r.RideID, r.RideStatus, r.Fare, r.Distance, r.StartTime, r.EndTime,
               pl.City PickupCity, pl.Street PickupStreet,
               dl.City DropoffCity, dl.Street DropoffStreet,
               CONCAT(du.FirstName,' ',du.LastName) DriverName,
               v.Make, v.Model,
               (SELECT COUNT(*) FROM RATINGS rt WHERE rt.RideID=r.RideID AND rt.RatedBy=%s) AS AlreadyRated
        FROM RIDES r
        JOIN LOCATIONS pl ON r.PickupLocationID=pl.LocationID
        JOIN LOCATIONS dl ON r.DropoffLocationID=dl.LocationID
        LEFT JOIN DRIVERS d   ON r.DriverID=d.DriverID
        LEFT JOIN USERS du    ON d.UserID=du.UserID
        LEFT JOIN VEHICLES v  ON r.VehicleID=v.VehicleID
        WHERE r.RiderID=%s ORDER BY r.RideID DESC
    """, (uid, uid)) or []
    return jsonify(clean(rows))

@app.route('/api/rider/complaints')
@role_required('Rider')
def api_rider_complaints():
    uid = session['user_id']
    rows = qry("""SELECT c.ComplaintID, c.RideID, c.Description, c.ComplaintStatus, c.CreatedAt
                  FROM COMPLAINTS c WHERE c.UserID=%s ORDER BY c.CreatedAt DESC""", (uid,)) or []
    return jsonify(clean(rows))

@app.route('/api/rider/request', methods=['POST'])
@role_required('Rider')
def api_request_ride():
    data    = request.get_json() or {}
    uid     = session['user_id']
    pickup  = data.get('pickup_id')
    dropoff = data.get('dropoff_id')
    v_type  = data.get('vehicle_type', 'Economy')
    if not pickup or not dropoff:
        return jsonify({'error': 'Pickup and dropoff are required'}), 400
    if int(pickup) == int(dropoff):
        return jsonify({'error': 'Pickup and dropoff must be different locations'}), 400
    # Find available driver + vehicle
    driver = qry("""SELECT d.DriverID FROM DRIVERS d
                    JOIN VEHICLES v ON v.DriverID=d.DriverID
                    WHERE d.AvailabilityStatus='Online' AND d.VerificationStatus='Verified'
                    AND v.VehicleType=%s AND v.VerificationStatus='Verified'
                    LIMIT 1""", (v_type,), one=True)
    did = driver['DriverID'] if driver else None
    vid = None
    if did:
        veh = qry("SELECT VehicleID FROM VEHICLES WHERE DriverID=%s AND VehicleType=%s AND VerificationStatus='Verified' LIMIT 1",
                  (did, v_type), one=True)
        vid = veh['VehicleID'] if veh else None
    conn = get_db()
    try:
        cur = conn.cursor()
        status = 'Accepted' if did else 'Requested'
        cur.execute("""INSERT INTO RIDES (RiderID,DriverID,VehicleID,PickupLocationID,DropoffLocationID,RideStatus)
                       VALUES (%s,%s,%s,%s,%s,%s)""",
                    (uid, did, vid, pickup, dropoff, status))
        ride_id = cur.lastrowid
        if did:
            cur.execute("UPDATE DRIVERS SET AvailabilityStatus='In-Ride' WHERE DriverID=%s", (did,))
        conn.commit()
        return jsonify({'success': True, 'ride_id': ride_id, 'assigned': bool(did), 'status': status})
    except Exception as e:
        try: conn.rollback()
        except: pass
        return jsonify({'error': str(e)}), 500
    finally:
        try: conn.close()
        except: pass

@app.route('/api/rider/rate', methods=['POST'])
@role_required('Rider')
def api_rate_driver():
    data    = request.get_json() or {}
    uid     = session['user_id']
    ride_id = data.get('ride_id')
    score   = data.get('score')
    comment = (data.get('comment') or '').strip()
    if not ride_id or not score:
        return jsonify({'error': 'ride_id and score are required'}), 400
    if not (1 <= int(score) <= 5):
        return jsonify({'error': 'Score must be between 1 and 5'}), 400
    ride = qry("SELECT DriverID FROM RIDES WHERE RideID=%s AND RiderID=%s AND RideStatus='Completed'",
               (ride_id, uid), one=True)
    if not ride:
        return jsonify({'error': 'Ride not found or not completed'}), 404
    if not ride['DriverID']:
        return jsonify({'error': 'No driver assigned to this ride'}), 400
    driver_user = qry("SELECT UserID FROM DRIVERS WHERE DriverID=%s", (ride['DriverID'],), one=True)
    try:
        qry("INSERT INTO RATINGS (RideID,RatedBy,RatedUserID,Score,Comment) VALUES (%s,%s,%s,%s,%s)",
            (ride_id, uid, driver_user['UserID'], score, comment), commit=True)
        return jsonify({'success': True})
    except Exception as e:
        if 'Duplicate' in str(e):
            return jsonify({'error': 'You already rated this ride'}), 409
        return jsonify({'error': str(e)}), 500

@app.route('/api/rider/promo', methods=['POST'])
@role_required('Rider')
def api_apply_promo():
    data = request.get_json() or {}
    ride_id = data.get('ride_id')
    code    = (data.get('code') or '').strip().upper()
    if not ride_id or not code:
        return jsonify({'error': 'ride_id and code required'}), 400
    try:
        results = call_proc('ApplyPromoCode', (ride_id, code))
        msg = results[0].get('Result','Promo applied!') if results else 'Promo applied!'
        return jsonify({'success': True, 'message': msg})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/rider/complaint', methods=['POST'])
@role_required('Rider')
def api_file_complaint():
    data = request.get_json() or {}
    uid  = session['user_id']
    ride_id = data.get('ride_id')
    desc    = (data.get('description') or '').strip()
    if not ride_id or not desc:
        return jsonify({'error': 'ride_id and description are required'}), 400
    qry("INSERT INTO COMPLAINTS (RideID,UserID,Description) VALUES (%s,%s,%s)",
        (ride_id, uid, desc), commit=True)
    return jsonify({'success': True})

# ══════════════════════════════════════════════════════════════
# DRIVER API
# ══════════════════════════════════════════════════════════════
def _get_driver_id():
    row = qry("SELECT DriverID FROM DRIVERS WHERE UserID=%s", (session['user_id'],), one=True)
    return row['DriverID'] if row else None

@app.route('/api/driver/profile')
@role_required('Driver')
def api_driver_profile():
    uid = session['user_id']
    row = qry("""SELECT d.DriverID, d.AvailabilityStatus, d.WalletBalance,
                        d.CommissionRate, d.VerificationStatus,
                        COALESCE(l.City,'Unknown') CurrentCity
                 FROM DRIVERS d
                 LEFT JOIN LOCATIONS l ON d.CurrentLocationID=l.LocationID
                 WHERE d.UserID=%s""", (uid,), one=True)
    if not row:
        return jsonify({'error': 'Driver profile not found'}), 404
    earn = qry("SELECT * FROM vw_DriverEarnings WHERE DriverID=%s", (row['DriverID'],), one=True) or {}
    avg = qry("SELECT ROUND(AVG(Score),2) avg FROM RATINGS WHERE RatedUserID=%s", (uid,), one=True) or {}
    return jsonify({
        'driver_id':    row['DriverID'],
        'availability': row['AvailabilityStatus'],
        'wallet':       float(row['WalletBalance'] or 0),
        'commission':   float(row['CommissionRate'] or 0),
        'verified':     row['VerificationStatus'],
        'city':         row['CurrentCity'],
        'avg_rating':   float(avg.get('avg') or 0),
        'completed_rides':     int(earn.get('CompletedRides') or 0),
        'gross_earnings':      float(earn.get('GrossEarnings') or 0),
        'net_earnings':        float(earn.get('NetEarnings') or 0),
        'platform_commission': float(earn.get('PlatformCommission') or 0),
    })

@app.route('/api/driver/toggle', methods=['POST'])
@role_required('Driver')
def api_driver_toggle():
    uid = session['user_id']
    row = qry("SELECT AvailabilityStatus FROM DRIVERS WHERE UserID=%s", (uid,), one=True)
    if not row:
        return jsonify({'error': 'Driver not found'}), 404
    current = row['AvailabilityStatus']
    if current == 'In-Ride':
        return jsonify({'error': 'Cannot change status while on a ride'}), 400
    new = 'Offline' if current == 'Online' else 'Online'
    qry("UPDATE DRIVERS SET AvailabilityStatus=%s WHERE UserID=%s", (new, uid), commit=True)
    return jsonify({'success': True, 'status': new})

@app.route('/api/driver/requests')
@role_required('Driver')
def api_driver_requests():
    did = _get_driver_id()
    if not did:
        return jsonify([])
    rows = qry("""
        SELECT r.RideID, r.Fare, r.Distance, r.RideStatus, r.StartTime,
               pl.City PickupCity, pl.Street PickupStreet,
               dl.City DropoffCity, dl.Street DropoffStreet,
               CONCAT(u.FirstName,' ',u.LastName) RiderName
        FROM RIDES r
        JOIN LOCATIONS pl ON r.PickupLocationID=pl.LocationID
        JOIN LOCATIONS dl ON r.DropoffLocationID=dl.LocationID
        JOIN USERS u ON r.RiderID=u.UserID
        WHERE r.DriverID=%s AND r.RideStatus IN ('Accepted','InProgress')
        ORDER BY r.RideID DESC
    """, (did,)) or []
    return jsonify(clean(rows))

@app.route('/api/driver/ride/<int:rid>/start', methods=['POST'])
@role_required('Driver')
def api_start_ride(rid):
    did = _get_driver_id()
    n = qry("UPDATE RIDES SET RideStatus='InProgress',StartTime=NOW() WHERE RideID=%s AND DriverID=%s AND RideStatus='Accepted'",
            (rid, did), commit=True)
    if not n:
        return jsonify({'error': 'Ride not found or cannot be started'}), 400
    qry("UPDATE DRIVERS SET AvailabilityStatus='In-Ride' WHERE DriverID=%s", (did,), commit=True)
    return jsonify({'success': True})

@app.route('/api/driver/ride/<int:rid>/complete', methods=['POST'])
@role_required('Driver')
def api_complete_ride(rid):
    did = _get_driver_id()
    # Use fresh connection for the multi-step transaction
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database unavailable'}), 503
    try:
        cur = conn.cursor(dictionary=True)
        # 1. Mark ride completed
        cur.execute("UPDATE RIDES SET RideStatus='Completed', EndTime=NOW() WHERE RideID=%s AND DriverID=%s AND RideStatus='InProgress'",
                    (rid, did))
        if cur.rowcount == 0:
            conn.rollback()
            return jsonify({'error': 'Ride not found or already completed'}), 400
        conn.commit()

        # 2. Calculate fare via stored procedure (needs separate call)
        cur.close()
        conn.close()
        call_proc('CalculateFare', (rid,))   # commits internally

        # 3. Fetch updated fare
        conn = get_db()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT Fare, RiderID FROM RIDES WHERE RideID=%s", (rid,))
        ride = cur.fetchone()

        # 4. Insert payment (trigger trg_CreditDriverWallet fires here)
        cur.execute("""INSERT INTO PAYMENTS (RideID,RiderID,Amount,PaymentMethod,PaymentStatus)
                       VALUES (%s,%s,%s,'Cash','Paid')""",
                    (rid, ride['RiderID'], ride['Fare']))
        conn.commit()
        return jsonify({'success': True, 'fare': float(ride['Fare'])})
    except Exception as e:
        try: conn.rollback()
        except: pass
        return jsonify({'error': str(e)}), 500
    finally:
        try: conn.close()
        except: pass

@app.route('/api/driver/ratings')
@role_required('Driver')
def api_driver_ratings():
    uid = session['user_id']
    rows = qry("""SELECT rt.Score, rt.Comment, rt.Timestamp, rt.RideID,
                         CONCAT(u.FirstName,' ',u.LastName) RatedByName
                  FROM RATINGS rt JOIN USERS u ON rt.RatedBy=u.UserID
                  WHERE rt.RatedUserID=%s ORDER BY rt.Timestamp DESC LIMIT 20""", (uid,)) or []
    return jsonify(clean(rows))

@app.route('/api/driver/payout', methods=['POST'])
@role_required('Driver')
def api_driver_payout():
    did = _get_driver_id()
    if not did:
        return jsonify({'error': 'Driver not found'}), 404
    try:
        results = call_proc('RequestPayout', (did,))
        msg = results[0].get('Result', 'Payout processed') if results else 'Payout processed'
        return jsonify({'success': True, 'message': msg})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
