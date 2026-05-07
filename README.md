# RideFlow Backend — Node.js + Express REST API

> Database Systems Lab (AI & DS) | Spring 2026 | 24i_0026 / 24i_0127

---

## Tech Stack

| Layer        | Technology              |
|--------------|-------------------------|
| Runtime      | Node.js v18+            |
| Framework    | Express.js v4           |
| Database     | MySQL 8 (rideflow DB)   |
| DB Driver    | mysql2 (promise-based)  |
| Auth         | JWT (jsonwebtoken)      |
| Passwords    | bcryptjs                |
| Environment  | dotenv                  |
| Dev server   | nodemon                 |

---

## Project Structure

```
rideflow-backend/
├── server.js                  ← Entry point, middleware, route mounting
├── .env.example               ← Copy to .env and fill in values
├── package.json
│
├── config/
│   └── db.js                  ← MySQL2 connection pool
│
├── middleware/
│   └── auth.js                ← JWT verify + role guards (requireAdmin / requireRider / requireDriver)
│
├── controllers/
│   ├── authController.js      ← register, login, me
│   ├── adminController.js     ← all admin features (20 endpoints)
│   ├── riderController.js     ← all rider features (15 endpoints)
│   └── driverController.js    ← all driver features (16 endpoints)
│
├── routes/
│   ├── auth.js                ← /api/auth/*
│   ├── admin.js               ← /api/admin/*
│   ├── rider.js               ← /api/rider/*
│   └── driver.js              ← /api/driver/*
│
└── utils/
    └── helpers.js             ← asyncHandler, sendSuccess, sendError, globalErrorHandler
```

---

## Setup

### 1. Prerequisites
- Node.js v18 or higher
- MySQL 8 with the `rideflow` database already set up  
  *(Run SQL files 00 → 09 first as described in the Implementation Guide)*

### 2. Install dependencies
```bash
cd rideflow-backend
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env with your MySQL credentials
```

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=rideflow
DB_USER=admin_user
DB_PASSWORD=Admin@RideFlow2026
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=24h
PORT=5000
```

### 4. Start the server
```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

You should see:
```
✅  MySQL connected — rideflow database ready
🚀  RideFlow API running on http://localhost:5000
```

---

## Authentication Flow

All protected routes require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

**Token payload contains:** `userID`, `role`, `driverID` (drivers only)

### Role → Route Access
| Role   | Accessible Prefixes         |
|--------|-----------------------------|
| Any    | `POST /api/auth/login`      |
| Any    | `POST /api/auth/register`   |
| Admin  | `/api/admin/*`              |
| Rider  | `/api/rider/*`              |
| Driver | `/api/driver/*`             |

---

## API Reference

### Auth Endpoints

| Method | Endpoint              | Auth | Description              |
|--------|-----------------------|------|--------------------------|
| POST   | `/api/auth/register`  | ✗    | Register Rider or Driver |
| POST   | `/api/auth/login`     | ✗    | Login, receive JWT       |
| GET    | `/api/auth/me`        | ✓    | Get own profile          |

#### POST /api/auth/register
```json
{
  "firstName": "Sara",
  "lastName": "Ahmed",
  "email": "sara@gmail.com",
  "password": "Password123",
  "role": "Rider",
  "phone": "+92-311-2222222"
}
```
For Driver, also include:
```json
{
  "role": "Driver",
  "licenseNumber": "LHR-2024-12345",
  "cnic": "35202-1234567-1"
}
```

#### POST /api/auth/login
```json
{ "email": "sara@gmail.com", "password": "Password123" }
```
Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "user": { "userID": 2, "role": "Rider", "firstName": "Sara" }
  }
}
```

---

### Admin Endpoints `/api/admin/*`

> All require: `Authorization: Bearer <admin_jwt>`

#### User Management
| Method | Endpoint                    | Body / Query           | Description              |
|--------|-----------------------------|------------------------|--------------------------|
| GET    | `/users`                    | `?role=Rider&status=Active` | List all users      |
| PATCH  | `/users/:id/status`         | `{ "status": "Suspended" }` | Suspend/Ban/Activate |

#### Driver Management
| Method | Endpoint                    | Body                          | Description       |
|--------|-----------------------------|-------------------------------|-------------------|
| GET    | `/drivers`                  | —                             | All drivers       |
| PATCH  | `/drivers/:id/verify`       | `{ "status": "Verified" }`    | Verify driver     |
| POST   | `/drivers/:id/payout`       | —                             | Process payout    |

#### Vehicle Management
| Method | Endpoint                    | Body                          | Description       |
|--------|-----------------------------|-------------------------------|-------------------|
| GET    | `/vehicles`                 | —                             | All vehicles      |
| PATCH  | `/vehicles/:id/verify`      | `{ "status": "Verified" }`    | Verify vehicle    |

#### Promo Codes
| Method | Endpoint                    | Body                          | Description         |
|--------|-----------------------------|-------------------------------|---------------------|
| GET    | `/promocodes`               | —                             | All promo codes     |
| POST   | `/promocodes`               | See below                     | Create promo code   |
| PATCH  | `/promocodes/:id/status`    | `{ "status": "Disabled" }`    | Update status       |

```json
POST /api/admin/promocodes
{
  "code": "SUMMER30",
  "discountPercentage": 30,
  "maxDiscount": 200,
  "validFrom": "2026-06-01 00:00:00",
  "validTo": "2026-08-31 23:59:59",
  "usageLimit": 500
}
```

#### Complaints
| Method | Endpoint                    | Body                          | Description         |
|--------|-----------------------------|-------------------------------|---------------------|
| GET    | `/complaints`               | `?status=Open`                | List complaints     |
| PATCH  | `/complaints/:id`           | `{ "status": "Resolved" }`    | Update complaint    |

#### Ride Controls
| Method | Endpoint                    | Body                          | Description         |
|--------|-----------------------------|-------------------------------|---------------------|
| POST   | `/rides/:id/surge`          | `{ "multiplier": 1.5 }`       | Apply surge pricing |
| POST   | `/rides/:id/fare`           | —                             | Recalculate fare    |

#### Locations
| Method | Endpoint       | Description      |
|--------|----------------|------------------|
| GET    | `/locations`   | All locations    |
| POST   | `/locations`   | Add location     |

#### Reports
| Method | Endpoint                         | Query Params         | Description                    |
|--------|----------------------------------|----------------------|--------------------------------|
| GET    | `/reports/revenue-by-city`       | `?from=&to=`         | Revenue by city (date range)   |
| GET    | `/reports/driver-earnings`       | —                    | All driver earnings            |
| GET    | `/reports/revenue-by-payment`    | —                    | Revenue by payment method      |
| GET    | `/reports/leaderboard`           | —                    | Top 10 drivers per city        |
| GET    | `/reports/top-drivers`           | —                    | Drivers with avg rating > 4.5  |
| GET    | `/reports/active-rides`          | —                    | Currently InProgress rides     |
| GET    | `/reports/low-rated-drivers`     | —                    | Drivers with avg rating < 3.5  |

---

### Rider Endpoints `/api/rider/*`

> All require: `Authorization: Bearer <rider_jwt>`

#### Profile
| Method | Endpoint          | Description                  |
|--------|-------------------|------------------------------|
| GET    | `/profile`        | Get own profile              |
| PATCH  | `/profile`        | Update name/email            |
| POST   | `/phones`         | Add phone number             |
| DELETE | `/phones/:phone`  | Remove phone number          |

#### Browsing
| Method | Endpoint               | Query          | Description                   |
|--------|------------------------|----------------|-------------------------------|
| GET    | `/locations`           | `?city=Lahore` | Browse pickup/dropoff points  |
| GET    | `/drivers/available`   | `?city=Karachi`| Online verified drivers       |
| GET    | `/vehicles`            | `?type=Economy`| Available vehicle types       |

#### Rides
| Method | Endpoint              | Body / Query            | Description             |
|--------|-----------------------|-------------------------|-------------------------|
| POST   | `/rides`              | See below               | Request a ride          |
| GET    | `/rides`              | `?status=Completed`     | My ride history         |
| GET    | `/rides/:id`          | —                       | Single ride detail      |
| PATCH  | `/rides/:id/cancel`   | —                       | Cancel a Requested ride |
| POST   | `/rides/:id/promo`    | `{ "code": "RIDE20" }`  | Apply promo code        |

```json
POST /api/rider/rides
{
  "pickupLocationID": 1,
  "dropoffLocationID": 2,
  "scheduledTime": "2026-05-10 08:00:00"  // optional
}
```

#### Payments
| Method | Endpoint      | Body                                         | Description       |
|--------|---------------|----------------------------------------------|-------------------|
| POST   | `/payments`   | `{ "rideID": 7, "amount": 200, "paymentMethod": "Cash" }` | Pay for ride |
| GET    | `/payments`   | —                                            | Payment history   |

#### Promo Codes
| Method | Endpoint           | Description              |
|--------|--------------------|--------------------------|
| GET    | `/promocodes`      | Browse active promos     |
| GET    | `/my-promocodes`   | Promos I've used         |

#### Ratings & Complaints
| Method | Endpoint       | Body                                                     | Description         |
|--------|----------------|----------------------------------------------------------|---------------------|
| POST   | `/ratings`     | `{ "rideID":1, "driverUserID":7, "score":5, "comment":"Great!" }` | Rate driver |
| POST   | `/complaints`  | `{ "rideID": 5, "description": "Driver was late." }`    | File complaint      |
| GET    | `/complaints`  | —                                                        | My complaints       |

---

### Driver Endpoints `/api/driver/*`

> All require: `Authorization: Bearer <driver_jwt>`

#### Profile & Availability
| Method | Endpoint           | Body                                    | Description            |
|--------|--------------------|-----------------------------------------|------------------------|
| GET    | `/profile`         | —                                       | Driver profile         |
| PATCH  | `/profile`         | `{ "firstName": "...", "password":"..." }` | Update profile      |
| PATCH  | `/availability`    | `{ "status": "Online" }`                | Go Online/Offline      |
| PATCH  | `/location`        | `{ "locationID": 3 }`                   | Update current location|

#### Vehicles
| Method | Endpoint    | Body                                                    | Description         |
|--------|-------------|---------------------------------------------------------|---------------------|
| GET    | `/vehicles` | —                                                       | My registered vehicles |
| POST   | `/vehicles` | `{ "make":"Toyota","model":"Yaris","year":2023,"licensePlate":"LHR-9999","vehicleType":"Economy" }` | Register vehicle |

#### Rides
| Method | Endpoint                  | Body                           | Description              |
|--------|---------------------------|--------------------------------|--------------------------|
| GET    | `/rides/incoming`         | —                              | Requested rides          |
| GET    | `/rides`                  | `?status=Completed`            | My ride history          |
| PATCH  | `/rides/:id/accept`       | `{ "vehicleID": 1 }`           | Accept a ride            |
| PATCH  | `/rides/:id/start`        | —                              | Start ride (InProgress)  |
| PATCH  | `/rides/:id/complete`     | —                              | Complete ride            |

#### Earnings & Wallet
| Method | Endpoint     | Description                     |
|--------|--------------|---------------------------------|
| GET    | `/earnings`  | Summary from vw_DriverEarnings  |
| GET    | `/wallet`    | Current wallet balance          |
| POST   | `/payout`    | Request payout (zeroes wallet)  |
| GET    | `/payments`  | Payments for my rides           |

#### Ratings
| Method | Endpoint    | Body                                                      | Description      |
|--------|-------------|-----------------------------------------------------------|------------------|
| POST   | `/ratings`  | `{ "rideID":7, "riderUserID":4, "score":5, "comment":"" }` | Rate a rider   |
| GET    | `/ratings`  | —                                                         | Ratings I received |

---

## Database Triggers (Auto-Fired)

These fire automatically when you call the relevant API endpoints — no extra code needed:

| Trigger                       | Fired By                          | Effect                                  |
|-------------------------------|-----------------------------------|-----------------------------------------|
| `trg_CreditDriverWallet`      | `POST /api/rider/payments`        | Credits net earnings to driver wallet   |
| `trg_PaymentCompleteRide`     | `POST /api/rider/payments`        | Auto-sets ride to Completed             |
| `trg_DriverOnlineAfterRide`   | `PATCH /api/driver/rides/:id/complete` | Sets driver back to Online         |
| `trg_SuspendLowRatedDriver`   | `POST /api/rider/ratings`         | Suspends driver if avg < 3.5            |
| `trg_FlagLowRatedRider`       | `POST /api/driver/ratings`        | Suspends rider if avg < 3.0             |
| `trg_IncrPromoUsage`          | `POST /api/rider/rides/:id/promo` | Increments promo UsageCount             |

---

## Standard API Response Format

All endpoints return the same envelope:

```json
// Success
{
  "success": true,
  "message": "OK",
  "data": { ... }
}

// Error
{
  "success": false,
  "error": "Descriptive error message"
}
```

---

## Quick Test with curl

```bash
# 1. Login as rider
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sara.ahmed@gmail.com","password":"YourPassword"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 2. Request a ride
curl -X POST http://localhost:5000/api/rider/rides \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pickupLocationID":1,"dropoffLocationID":2}'

# 3. Check admin leaderboard
ADMIN_TOKEN=<admin_jwt>
curl http://localhost:5000/api/admin/reports/leaderboard \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

*RideFlow Backend — Node.js + Express + MySQL | Spring 2026*
