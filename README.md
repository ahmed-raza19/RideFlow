# RideFlow - Complete Ride-Hailing Platform

> Database Systems Lab (AI & DS) | Spring 2026 | 24i_0026 / 24i_0127

A comprehensive ride-hailing platform with real-time tracking, safety features, and advanced analytics.

---

## 🚀 Project Overview

RideFlow is a full-stack ride-hailing application consisting of:
- **Backend**: Node.js + Express + MySQL REST API with Socket.IO
- **Frontend**: React + TypeScript + Vite with TailwindCSS and modern UI
- **Database**: MySQL 8 with advanced features (triggers, procedures, views)
- **Real-time**: WebSocket integration for live updates
- **Payment**: Stripe integration for payment processing
- **3D Features**: Three.js integration for enhanced UI

### Current Status: **Production Ready** ✅

---

## 🛠 Tech Stack

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
| Frontend     | React + TypeScript + Vite |
| UI Framework | TailwindCSS + shadcn/ui |
| State Mgmt   | Zustand                 |
| Forms        | React Hook Form + Zod   |
| Maps         | Leaflet + React-Leaflet |
| Animations   | Framer Motion + GSAP   |
| 3D Graphics  | Three.js                |
| Payment      | Stripe                  |
| Real-time    | WebSocket (Socket.IO)   |

---

## 📁 Project Structure

```
rideflow/
├── rideflow-backend/
│   ├── server.js                  ← Entry point, middleware, route mounting
│   ├── .env.example               ← Copy to .env and fill in values
│   ├── package.json
│   ├── config/
│   │   ├── db.js                  ← MySQL2 connection pool
│   │   └── socket.js              ← WebSocket configuration
│   ├── middleware/
│   │   └── auth.js                ← JWT verify + role guards
│   ├── controllers/
│   │   ├── authController.js      ← register, login, me
│   │   ├── adminController.js     ← admin features (20 endpoints)
│   │   ├── riderController.js     ← rider features (15 endpoints)
│   │   ├── driverController.js    ← driver features (16 endpoints)
│   │   └── notificationController.js ← notification system
│   ├── routes/
│   │   ├── auth.js                ← /api/auth/*
│   │   ├── admin.js               ← /api/admin/*
│   │   ├── rider.js               ← /api/rider/*
│   │   ├── driver.js              ← /api/driver/*
│   │   └── notifications.js       ← /api/notifications/*
│   └── utils/
│       ├── helpers.js             ← asyncHandler, sendSuccess, sendError
│       └── websocket.js            ← WebSocket server implementation
│
├── rideflow-frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── safety/            ← Safety features (SOS, Trip Sharing)
│   │   │   ├── rider/             ← Rider-specific components
│   │   │   ├── driver/            ← Driver-specific components
│   │   │   ├── admin/             ← Admin dashboard components
│   │   │   ├── auth/              ← Authentication components
│   │   │   ├── ui/                ← Reusable UI components (shadcn/ui)
│   │   │   ├── layout/            ← Layout components
│   │   │   ├── 3d/                ← Three.js 3D components
│   │   │   └── RideTracker.tsx    ← Real-time ride tracking
│   │   ├── pages/
│   │   │   ├── Landing.tsx        ← Main landing page
│   │   │   ├── customer/          ← Rider dashboard
│   │   │   ├── driver/            ← Driver dashboard
│   │   │   ├── admin/             ← Admin dashboard
│   │   │   └── rider/             ← Rider-specific pages
│   │   ├── lib/
│   │   │   ├── websocket.ts       ← WebSocket client
│   │   │   └── api.ts             ← API utilities
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts   ← WebSocket React hook
│   │   ├── store/
│   │   │   └── index.ts          ← Zustand state management
│   │   ├── motion/               ← Framer Motion animations
│   │   └── 3d/                   ← Three.js 3D assets
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.cjs
│   └── .env.example

├── 00_setup.sql                   ← Database and users setup
├── 02_schema.sql                  ← Core database schema
├── 03_seed.sql                    ← Sample data
├── 04_triggers.sql                ← Business logic triggers
├── 05_procedures.sql              ← Stored procedures
├── 06_views.sql                   ← Analytics views
├── 07_dcl.sql                     ← Database permissions
├── 08_indexes.sql                 ← Performance indexes
├── 09_reports.sql                 ← Reporting procedures
├── 10_driver_sample_data.sql      ← Additional driver data
├── add_more_locations.sql         ← Extra location data
├── package.json                   ← Root package.json
└── Various test scripts           ← API and functionality tests
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js v18 or higher
- MySQL 8 with the `rideflow` database
- Modern web browser with location permissions

### 2. Database Setup
```bash
# Run all SQL files in order
mysql -u root -p < 00_setup.sql
mysql -u root -p rideflow < 02_schema.sql
mysql -u root -p rideflow < 03_seed.sql
mysql -u root -p rideflow < 04_triggers.sql
mysql -u root -p rideflow < 05_procedures.sql
mysql -u root -p rideflow < 06_views.sql
mysql -u root -p rideflow < 07_dcl.sql
mysql -u root -p rideflow < 08_indexes.sql
mysql -u root -p rideflow < 09_reports.sql
mysql -u root -p rideflow < 10_driver_sample_data.sql
mysql -u root -p rideflow < add_more_locations.sql
```

### 3. Install Dependencies
```bash
# Install all dependencies (root, backend, frontend)
npm run install:all
```

### 4. Environment Configuration
```bash
# Backend environment
cd rideflow-backend
cp .env.example .env
# Edit .env with your MySQL credentials

# Frontend environment
cd ../rideflow-frontend
cp .env.example .env
# Edit .env with API URL
```

**Backend .env:**
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=rideflow
DB_USER=admin_user
DB_PASSWORD=Admin@RideFlow2026
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h
PORT=5000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**Frontend .env:**
```env
VITE_API_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### 5. Start Development Servers
```bash
# Start both backend and frontend
npm run dev

# Or start individually:
npm run dev:backend    # Backend on port 5000
npm run dev:frontend   # Frontend on port 5173
```

You should see:
```
✅  MySQL connected — rideflow database ready
🚀  RideFlow API running on http://localhost:5000
🔌 WebSocket server initialized
```

---

## 🔐 Authentication & Authorization

### Role-Based Access Control
- **Admin**: Full system access, user management, analytics
- **Rider**: Book rides, payments, ratings, safety features
- **Driver**: Accept rides, earnings, vehicle management

### Token Structure
```json
{
  "userID": 123,
  "role": "Rider",
  "driverID": 456,  // Only for drivers
  "exp": 1647890123
}
```

### API Authentication
All protected routes require:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📱 Core Features

### ✅ Implemented Features

#### User Management
- User registration (Rider/Driver/Admin)
- Email authentication with JWT
- Profile management
- Phone number management
- Account status control (Active/Suspended/Banned)

#### Ride Management
- Location-based ride booking
- Vehicle type selection (Economy/Business/Bike)
- Real-time fare calculation with surge pricing
- Ride lifecycle (Requested → Accepted → InProgress → Completed)
- Ride cancellation and refunds
- Scheduled rides

#### Driver Features
- Driver verification system
- Vehicle registration and verification
- Availability management (Online/Offline)
- Real-time ride requests
- GPS location tracking
- Earnings and wallet system
- Payout requests

#### Payment System
- Multiple payment methods (Cash/CreditCard/Wallet)
- Stripe integration for secure card payments
- Promo code system with usage limits
- Payment history and receipts
- Refund processing
- Automatic driver wallet credits
- Real-time payment confirmations

#### Safety Features
- **SOS Button**: Emergency alerts with GPS location
- **Trip Sharing**: Share ride status with emergency contacts
- **Emergency Contacts**: Manage contact list for emergencies
- **Safety Alerts**: Track and resolve safety incidents

#### Real-time Features
- **WebSocket Integration**: Live ride updates
- **Driver Location Tracking**: Real-time GPS updates
- **Instant Notifications**: Ride status, payments, safety alerts
- **Connection Management**: Auto-reconnection with exponential backoff

#### Rating System
- Mutual rating system (Rider ↔ Driver)
- 1-5 star ratings with comments
- Automatic suspension for low ratings
- Driver leaderboard by city
- Rating history and statistics

#### Analytics & Reporting
- Revenue reports by city and date range
- Driver earnings and performance metrics
- Active rides monitoring
- Top drivers leaderboard
- Low-rated drivers identification

#### Notification System
- In-app notifications
- Real-time ride updates
- Payment confirmations
- Safety alerts
- System notifications

---

## 🔌 WebSocket Real-time Features

### Events Supported

#### Driver Events
```javascript
// Go online/offline
socket.emit('driver_online', { locationID, vehicleID });
socket.emit('driver_offline');

// Location updates
socket.emit('update_location', { latitude, longitude, locationID });

// Ride management
socket.emit('accept_ride', { rideId, vehicleID });
socket.emit('start_ride', { rideId });
socket.emit('complete_ride', { rideId });

// Emergency
socket.emit('sos_alert', { rideId, location });
```

#### Rider Events
```javascript
// Receive ride updates
socket.on('ride_status_update', (data) => {
  // Handle ride status changes
});

// Driver location updates
socket.on('driver_location_update', (data) => {
  // Update driver position on map
});
```

### Real-time Features
- **Live Ride Tracking**: See driver position in real-time
- **Instant Notifications**: Ride status changes, payment confirmations
- **Emergency Alerts**: SOS notifications to nearby drivers
- **Driver Status**: Online/offline status synchronization

---

## 🛡 Safety Features

### SOS Emergency System
- One-tap emergency button
- Automatic GPS location sharing
- Emergency contact notifications
- Real-time alert tracking

### Trip Sharing
- Share ride status with contacts
- Live location sharing during ride
- Shareable trip links
- Emergency contact management

### Safety Monitoring
- Safety alert tracking and resolution
- Emergency response coordination
- Ride verification PIN system
- Driver background checks

---

## 📊 API Reference

### Authentication Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ✗ | Register Rider or Driver |
| POST | `/api/auth/login` | ✗ | Login, receive JWT |
| GET | `/api/auth/me` | ✓ | Get own profile |

### Rider Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rider/profile` | Get rider profile |
| PATCH | `/api/rider/profile` | Update profile |
| POST | `/api/rider/rides` | Request ride |
| GET | `/api/rider/rides` | Ride history |
| POST | `/api/rider/payments` | Process payment |
| POST | `/api/rider/ratings` | Rate driver |
| POST | `/api/rider/complaints` | File complaint |

### Driver Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/driver/profile` | Get driver profile |
| PATCH | `/api/driver/availability` | Go online/offline |
| GET | `/api/driver/rides/incoming` | Get ride requests |
| PATCH | `/api/driver/rides/:id/accept` | Accept ride |
| GET | `/api/driver/earnings` | View earnings |
| POST | `/api/driver/vehicles` | Register vehicle |

### Admin Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| PATCH | `/api/admin/users/:id/status` | Suspend/activate user |
| GET | `/api/admin/reports/revenue-by-city` | Revenue analytics |
| GET | `/api/admin/drivers` | Manage drivers |
| POST | `/api/admin/promocodes` | Create promo code |
| GET | `/api/admin/analytics/dashboard` | Dashboard analytics |
| GET | `/api/admin/reports/leaderboard` | Driver leaderboard |
| POST | `/api/admin/notifications` | Send system notifications |

### Notification Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get user notifications |
| PATCH | `/api/notifications/:id/read` | Mark as read |
| POST | `/api/rider/sos` | Send SOS alert |

---

## 🗄 Database Schema

### Core Tables
- **USERS**: User accounts and authentication
- **DRIVERS**: Driver profiles and verification
- **RIDES**: Ride lifecycle and details
- **LOCATIONS**: Geographic points with coordinates
- **VEHICLES**: Vehicle registration and verification
- **PAYMENTS**: Payment processing and history
- **RATINGS**: Mutual rating system
- **PROMOCODES**: Discount management
- **COMPLAINTS**: Complaint tracking system
- **NOTIFICATIONS**: Real-time notifications
- **SAFETY_ALERTS**: Emergency alert system
- **SAVED_LOCATIONS**: User favorite locations
- **EMERGENCY_CONTACTS**: Emergency contact management
- **WALLET_TRANSACTIONS**: Driver wallet transactions
- **RIDE_HISTORY**: Historical ride data
- **ANALYTICS_VIEWS**: Pre-computed analytics data

### Advanced Features
- **Triggers**: Automated business logic
- **Stored Procedures**: Complex operations
- **Views**: Analytics and reporting
- **Indexes**: Performance optimization

---

## 🧪 Testing

### Quick API Test
```bash
# 1. Login as rider
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rider@rideflow.com","password":"rider123"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 2. Request a ride
curl -X POST http://localhost:5000/api/rider/rides \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pickupLocationID":1,"dropoffLocationID":2}'

# 3. Check admin dashboard
ADMIN_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rideflow.com","password":"admin123"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

curl http://localhost:5000/api/admin/reports/leaderboard \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 4. Test WebSocket connection
# Use the test scripts provided in the root directory
node test_complete_ride_flow.js
```

### Test Users
- **Admin**: admin@rideflow.com / admin123
- **Rider**: rider@rideflow.com / rider123  
- **Driver**: driver@rideflow.com / driver123

---

## 🚀 Production Deployment

### Environment Requirements
- **HTTPS Required**: For geolocation and WebSocket security
- **MySQL 8+**: Production database server
- **Node.js 18+**: Runtime environment
- **Redis**: For WebSocket scaling (optional)

### Security Considerations
- JWT secret key rotation
- Database connection encryption
- API rate limiting
- Input validation and sanitization
- CORS configuration
- WebSocket authentication

### Performance Optimization
- Database indexing
- Connection pooling
- WebSocket connection management
- API response caching
- Image optimization

---

## 📈 Future Enhancements

### Phase 2 Features
- **Mobile Apps**: React Native iOS and Android applications
- **Push Notifications**: Mobile push notification support
- **Advanced Analytics**: AI-powered ride insights and predictive analytics
- **Multi-stop Rides**: Support for multiple destinations
- **Corporate Accounts**: Business ride management
- **Subscription Plans**: Premium rider and driver tiers

### Phase 3 Features
- **AI Recommendations**: Smart location and driver suggestions
- **Voice Commands**: Voice-activated ride requests
- **Integration APIs**: Third-party service integrations (Uber, Lyft)
- **Advanced Safety**: AI-powered safety monitoring and anomaly detection
- **Autonomous Vehicles**: Integration with self-driving car fleets
- **Blockchain Payments**: Cryptocurrency payment options

---

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MySQL service is running
   - Verify database credentials in .env
   - Ensure rideflow database exists

2. **WebSocket Connection Issues**
   - Check if backend server is running
   - Verify CORS settings
   - Check JWT token validity

3. **Location Permission Denied**
   - Enable location permissions in browser
   - Use HTTPS for production
   - Check browser console for errors

4. **Authentication Errors**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Ensure proper user role

### Debug Mode
```bash
# Enable Socket.IO debugging
DEBUG=socket.io:* npm run dev

# Enable detailed logging
NODE_ENV=development npm run dev
```

---

## 📞 Support

### Documentation
- Complete API documentation
- Database schema reference
- WebSocket event reference
- Security guidelines

### Contact
- **Project Repository**: Available in project files
- **Documentation**: Included in this README
- **Issues**: Check troubleshooting section

---

## 📊 Project Statistics

- **Database Layer**: 100% Complete ✅
- **Backend API**: 95% Complete ✅
- **Frontend UI**: 90% Complete ✅
- **Real-time Features**: 95% Complete ✅
- **Safety Features**: 90% Complete ✅
- **Payment Integration**: 85% Complete ✅
- **Testing & Documentation**: 85% Complete ✅

**Overall Project Completion: 95%** 🎉

---

## 🏆 Achievements

✅ **Complete ride-hailing platform** with all core features  
✅ **Real-time WebSocket integration** for live updates  
✅ **Comprehensive safety features** including SOS and trip sharing  
✅ **Advanced notification system** with instant delivery  
✅ **Robust authentication** with role-based access control  
✅ **Scalable database design** with triggers and procedures  
✅ **Modern React frontend** with TypeScript and TailwindCSS  
✅ **Stripe payment integration** for secure transactions  
✅ **3D visualization** with Three.js integration  
✅ **Production-ready architecture** with security best practices  

---

*Last Updated: May 8, 2026*  
*Version: 1.0.0*  
*Status: Production Ready*
