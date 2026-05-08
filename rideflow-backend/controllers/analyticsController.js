// controllers/analyticsController.js
// Advanced analytics for driver earnings insights

const db = require('../config/db');
const { asyncHandler, sendSuccess, sendError } = require('../utils/helpers');

// ─── Earnings Analytics ───────────────────────────────────────

// GET /api/analytics/earnings/overview
const getEarningsOverview = asyncHandler(async (req, res) => {
  const [[driver]] = await db.query(
    'SELECT DriverID FROM DRIVERS WHERE UserID = ?', [req.user.userID]);
  
  // Get comprehensive earnings overview
  const [overview] = await db.query(`
    SELECT 
      COUNT(*) as TotalRides,
      SUM(CASE WHEN r.RideStatus = 'Completed' THEN 1 ELSE 0 END) as CompletedRides,
      SUM(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare ELSE 0 END) as GrossEarnings,
      SUM(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare * (d.CommissionRate / 100) ELSE 0 END) as TotalCommission,
      SUM(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare * (1 - d.CommissionRate / 100) ELSE 0 END) as NetEarnings,
      AVG(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare ELSE NULL END) as AverageFare,
      MIN(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare ELSE NULL END) as MinimumFare,
      MAX(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare ELSE NULL END) as MaximumFare,
      SUM(CASE WHEN r.RideStatus = 'Completed' THEN r.Distance ELSE NULL END) as TotalDistance,
      AVG(CASE WHEN r.RideStatus = 'Completed' THEN r.Distance ELSE NULL END) as AverageDistance,
      d.WalletBalance,
      d.CommissionRate
    FROM RIDES r
    JOIN DRIVERS d ON r.DriverID = d.DriverID
    WHERE r.DriverID = ?
  `, [driver.DriverID]);

  return sendSuccess(res, overview[0]);
});

// GET /api/analytics/earnings/daily
const getDailyEarnings = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const [[driver]] = await db.query(
    'SELECT DriverID FROM DRIVERS WHERE UserID = ?', [req.user.userID]);
  
  const [dailyData] = await db.query(`
    SELECT 
      DATE(r.StartTime) as Date,
      COUNT(*) as TotalRides,
      SUM(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare ELSE 0 END) as GrossEarnings,
      SUM(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare * (1 - d.CommissionRate / 100) ELSE 0 END) as NetEarnings,
      SUM(CASE WHEN r.RideStatus = 'Completed' THEN r.Distance ELSE NULL END) as TotalDistance,
      AVG(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare ELSE NULL END) as AverageFare
    FROM RIDES r
    JOIN DRIVERS d ON r.DriverID = d.DriverID
    WHERE r.DriverID = ? 
      AND r.StartTime >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      AND r.RideStatus = 'Completed'
    GROUP BY DATE(r.StartTime)
    ORDER BY Date DESC
  `, [driver.DriverID, days]);

  return sendSuccess(res, dailyData);
});

// GET /api/analytics/earnings/weekly
const getWeeklyEarnings = asyncHandler(async (req, res) => {
  const { weeks = 12 } = req.query;
  const [[driver]] = await db.query(
    'SELECT DriverID FROM DRIVERS WHERE UserID = ?', [req.user.userID]);
  
  const [weeklyData] = await db.query(`
    SELECT 
      YEARWEEK(r.StartTime) as Week,
      DATE(r.StartTime) as WeekStart,
      COUNT(*) as TotalRides,
      SUM(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare ELSE 0 END) as GrossEarnings,
      SUM(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare * (1 - d.CommissionRate / 100) ELSE 0 END) as NetEarnings,
      SUM(CASE WHEN r.RideStatus = 'Completed' THEN r.Distance ELSE NULL END) as TotalDistance,
      AVG(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare ELSE NULL END) as AverageFare
    FROM RIDES r
    JOIN DRIVERS d ON r.DriverID = d.DriverID
    WHERE r.DriverID = ? 
      AND r.StartTime >= DATE_SUB(CURDATE(), INTERVAL ? WEEK)
      AND r.RideStatus = 'Completed'
    GROUP BY YEARWEEK(r.StartTime), DATE(r.StartTime)
    ORDER BY Week DESC
  `, [driver.DriverID, weeks]);

  return sendSuccess(res, weeklyData);
});

// GET /api/analytics/earnings/monthly
const getMonthlyEarnings = asyncHandler(async (req, res) => {
  const { months = 12 } = req.query;
  const [[driver]] = await db.query(
    'SELECT DriverID FROM DRIVERS WHERE UserID = ?', [req.user.userID]);
  
  const [monthlyData] = await db.query(`
    SELECT 
      YEAR(r.StartTime) as Year,
      MONTH(r.StartTime) as Month,
      DATE_FORMAT(r.StartTime, '%Y-%m') as MonthLabel,
      COUNT(*) as TotalRides,
      SUM(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare ELSE 0 END) as GrossEarnings,
      SUM(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare * (1 - d.CommissionRate / 100) ELSE 0 END) as NetEarnings,
      SUM(CASE WHEN r.RideStatus = 'Completed' THEN r.Distance ELSE NULL END) as TotalDistance,
      AVG(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare ELSE NULL END) as AverageFare
    FROM RIDES r
    JOIN DRIVERS d ON r.DriverID = d.DriverID
    WHERE r.DriverID = ? 
      AND r.StartTime >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
      AND r.RideStatus = 'Completed'
    GROUP BY YEAR(r.StartTime), MONTH(r.StartTime), DATE_FORMAT(r.StartTime, '%Y-%m')
    ORDER BY Year DESC, Month DESC
  `, [driver.DriverID, months]);

  return sendSuccess(res, monthlyData);
});

// ─── Performance Analytics ───────────────────────────────────

// GET /api/analytics/performance/metrics
const getPerformanceMetrics = asyncHandler(async (req, res) => {
  const [[driver]] = await db.query(
    'SELECT DriverID FROM DRIVERS WHERE UserID = ?', [req.user.userID]);
  
  const [metrics] = await db.query(`
    SELECT 
      -- Ride completion metrics
      COUNT(*) as TotalRides,
      SUM(CASE WHEN r.RideStatus = 'Completed' THEN 1 ELSE 0 END) as CompletedRides,
      SUM(CASE WHEN r.RideStatus = 'Cancelled' THEN 1 ELSE 0 END) as CancelledRides,
      (SUM(CASE WHEN r.RideStatus = 'Completed' THEN 1 ELSE 0 END) / COUNT(*)) * 100 as CompletionRate,
      
      -- Earnings metrics
      SUM(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare * (1 - d.CommissionRate / 100) ELSE 0 END) as NetEarnings,
      AVG(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare ELSE NULL END) as AverageEarningsPerRide,
      
      -- Distance metrics
      SUM(CASE WHEN r.RideStatus = 'Completed' THEN r.Distance ELSE NULL END) as TotalDistance,
      AVG(CASE WHEN r.RideStatus = 'Completed' THEN r.Distance ELSE NULL END) as AverageDistancePerRide,
      
      -- Time metrics
      AVG(CASE WHEN r.RideStatus = 'Completed' AND r.StartTime IS NOT NULL AND r.EndTime IS NOT NULL 
          THEN TIMESTAMPDIFF(MINUTE, r.StartTime, r.EndTime) ELSE NULL END) as AverageRideDuration,
      
      -- Rating metrics
      AVG(rating.AverageRating) as AverageRating,
      rating.UniqueRaters,
      
      -- Efficiency metrics
      (SUM(CASE WHEN r.RideStatus = 'Completed' THEN r.Distance ELSE NULL END) / 
       NULLIF(SUM(CASE WHEN r.RideStatus = 'Completed' AND r.StartTime IS NOT NULL AND r.EndTime IS NOT NULL 
          THEN TIMESTAMPDIFF(MINUTE, r.StartTime, r.EndTime) ELSE NULL END), 0)) as KilometersPerHour
       
    FROM RIDES r
    JOIN DRIVERS d ON r.DriverID = d.DriverID
    LEFT JOIN (
      SELECT 
        RatedUserID,
        AVG(Score) as AverageRating,
        COUNT(*) as RatingCount,
        COUNT(DISTINCT RatedBy) as UniqueRaters
      FROM RATINGS 
      GROUP BY RatedUserID
    ) rating ON r.DriverID = rating.RatedUserID
    WHERE r.DriverID = ?
  `, [driver.DriverID]);

  return sendSuccess(res, metrics[0]);
});

// GET /api/analytics/performance/trends
const getPerformanceTrends = asyncHandler(async (req, res) => {
  const { period = 'daily' } = req.query;
  const [[driver]] = await db.query(
    'SELECT DriverID FROM DRIVERS WHERE UserID = ?', [req.user.userID]);
  
  let timeFormat, groupBy, interval;
  
  switch (period) {
    case 'weekly':
      timeFormat = '%Y-%u';
      groupBy = 'YEARWEEK(r.StartTime)';
      interval = 'INTERVAL 12 WEEK';
      break;
    case 'monthly':
      timeFormat = '%Y-%m';
      groupBy = 'DATE_FORMAT(r.StartTime, "%Y-%m")';
      interval = 'INTERVAL 12 MONTH';
      break;
    default: // daily
      timeFormat = '%Y-%m-%d';
      groupBy = 'DATE(r.StartTime)';
      interval = 'INTERVAL 30 DAY';
  }
  
  const [trends] = await db.query(`
    SELECT 
      ${groupBy} as Period,
      COUNT(*) as TotalRides,
      SUM(CASE WHEN r.RideStatus = 'Completed' THEN 1 ELSE 0 END) as CompletedRides,
      SUM(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare ELSE 0 END) as GrossEarnings,
      SUM(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare * (1 - d.CommissionRate / 100) ELSE 0 END) as NetEarnings,
      AVG(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare ELSE NULL END) as AverageFare,
      SUM(CASE WHEN r.RideStatus = 'Completed' THEN r.Distance ELSE NULL END) as TotalDistance,
      AVG(CASE WHEN r.RideStatus = 'Completed' THEN r.Distance ELSE NULL END) as AverageDistance,
      AVG(rating.Score) as AverageRating
    FROM RIDES r
    JOIN DRIVERS d ON r.DriverID = d.DriverID
    LEFT JOIN RATINGS rating ON r.RideID = rating.RideID
    WHERE r.DriverID = ? 
      AND r.StartTime >= DATE_SUB(CURDATE(), ${interval})
    GROUP BY Period
    ORDER BY Period ASC
  `, [driver.DriverID]);

  return sendSuccess(res, trends);
});

// ─── Location Analytics ───────────────────────────────────────

// GET /api/analytics/locations/hotspots
const getLocationHotspots = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const [[driver]] = await db.query(
    'SELECT DriverID FROM DRIVERS WHERE UserID = ?', [req.user.userID]);
  
  const [hotspots] = await db.query(`
    SELECT 
      pl.City as PickupCity,
      pl.Street as PickupStreet,
      COUNT(*) as PickupCount,
      SUM(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare ELSE 0 END) as TotalEarnings,
      AVG(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare ELSE NULL END) as AverageFare
    FROM RIDES r
    JOIN LOCATIONS pl ON r.PickupLocationID = pl.LocationID
    WHERE r.DriverID = ? 
      AND r.RideStatus = 'Completed'
      AND r.StartTime >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY pl.LocationID, pl.City, pl.Street
    ORDER BY PickupCount DESC
    LIMIT ?
  `, [driver.DriverID, limit]);

  return sendSuccess(res, hotspots);
});

// GET /api/analytics/locations/routes
const getPopularRoutes = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const [[driver]] = await db.query(
    'SELECT DriverID FROM DRIVERS WHERE UserID = ?', [req.user.userID]);
  
  const [routes] = await db.query(`
    SELECT 
      pl.City as PickupCity,
      dl.City as DropoffCity,
      COUNT(*) as RouteCount,
      SUM(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare ELSE 0 END) as TotalEarnings,
      AVG(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare ELSE NULL END) as AverageFare,
      AVG(CASE WHEN r.RideStatus = 'Completed' THEN r.Distance ELSE NULL END) as AverageDistance
    FROM RIDES r
    JOIN LOCATIONS pl ON r.PickupLocationID = pl.LocationID
    JOIN LOCATIONS dl ON r.DropoffLocationID = dl.LocationID
    WHERE r.DriverID = ? 
      AND r.RideStatus = 'Completed'
      AND r.StartTime >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY pl.City, dl.City
    ORDER BY RouteCount DESC
    LIMIT ?
  `, [driver.DriverID, limit]);

  return sendSuccess(res, routes);
});

// ─── Time Analytics ───────────────────────────────────────────

// GET /api/analytics/time/peak-hours
const getPeakHours = asyncHandler(async (req, res) => {
  const [[driver]] = await db.query(
    'SELECT DriverID FROM DRIVERS WHERE UserID = ?', [req.user.userID]);
  
  const [peakHours] = await db.query(`
    SELECT 
      HOUR(r.StartTime) as Hour,
      COUNT(*) as RideCount,
      SUM(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare ELSE 0 END) as TotalEarnings,
      AVG(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare ELSE NULL END) as AverageFare,
      (SUM(CASE WHEN r.RideStatus = 'Completed' THEN 1 ELSE 0 END) / COUNT(*)) * 100 as CompletionRate
    FROM RIDES r
    WHERE r.DriverID = ? 
      AND r.StartTime >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY HOUR(r.StartTime)
    ORDER BY Hour ASC
  `, [driver.DriverID]);

  return sendSuccess(res, peakHours);
});

// GET /api/analytics/time/peak-days
const getPeakDays = asyncHandler(async (req, res) => {
  const [[driver]] = await db.query(
    'SELECT DriverID FROM DRIVERS WHERE UserID = ?', [req.user.userID]);
  
  const [peakDays] = await db.query(`
    SELECT 
      DAYNAME(r.StartTime) as DayName,
      DAYOFWEEK(r.StartTime) as DayNumber,
      COUNT(*) as RideCount,
      SUM(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare ELSE 0 END) as TotalEarnings,
      AVG(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare ELSE NULL END) as AverageFare
    FROM RIDES r
    WHERE r.DriverID = ? 
      AND r.StartTime >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY DAYNAME(r.StartTime), DAYOFWEEK(r.StartTime)
    ORDER BY DayNumber ASC
  `, [driver.DriverID]);

  return sendSuccess(res, peakDays);
});

// ─── Forecasting ─────────────────────────────────────────────

// GET /api/analytics/forecast/earnings
const getEarningsForecast = asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;
  const [[driver]] = await db.query(
    'SELECT DriverID FROM DRIVERS WHERE UserID = ?', [req.user.userID]);
  
  // Get historical data for forecasting
  const [historical] = await db.query(`
    SELECT 
      DATE(r.StartTime) as Date,
      SUM(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare * (1 - d.CommissionRate / 100) ELSE 0 END) as NetEarnings,
      COUNT(*) as RidesCount
    FROM RIDES r
    JOIN DRIVERS d ON r.DriverID = d.DriverID
    WHERE r.DriverID = ? 
      AND r.StartTime >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      AND r.RideStatus = 'Completed'
    GROUP BY DATE(r.StartTime)
    ORDER BY Date ASC
  `, [driver.DriverID]);

  // Simple moving average forecast
  const forecast = [];
  const movingAveragePeriod = 7;
  
  for (let i = 1; i <= days; i++) {
    const forecastDate = new Date();
    forecastDate.setDate(forecastDate.getDate() + i);
    
    // Calculate moving average from historical data
    const recentData = historical.slice(-movingAveragePeriod);
    const avgEarnings = recentData.reduce((sum, day) => sum + (day.NetEarnings || 0), 0) / recentData.length;
    const avgRides = recentData.reduce((sum, day) => sum + (day.RidesCount || 0), 0) / recentData.length;
    
    // Add some variance for realism
    const variance = 0.2; // 20% variance
    const randomFactor = 1 + (Math.random() - 0.5) * variance;
    
    forecast.push({
      Date: forecastDate.toISOString().split('T')[0],
      PredictedEarnings: Math.round(avgEarnings * randomFactor),
      PredictedRides: Math.round(avgRides * randomFactor),
      Confidence: Math.max(70, 100 - (i * 5)) // Decreasing confidence
    });
  }

  return sendSuccess(res, {
    Forecast: forecast,
    HistoricalAverage: {
      DailyEarnings: historical.reduce((sum, day) => sum + (day.NetEarnings || 0), 0) / historical.length,
      DailyRides: historical.reduce((sum, day) => sum + (day.RidesCount || 0), 0) / historical.length
    }
  });
});

// ─── Export Analytics ──────────────────────────────────────────

// GET /api/analytics/export/:type
const exportAnalytics = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { format = 'csv' } = req.query;
  const [[driver]] = await db.query(
    'SELECT DriverID FROM DRIVERS WHERE UserID = ?', [req.user.userID]);

  let data = [];
  let filename = '';
  
  switch (type) {
    case 'earnings':
      // Get comprehensive earnings data
      const [earningsData] = await db.query(`
        SELECT 
          DATE(r.StartTime) as Date,
          COUNT(*) as TotalRides,
          SUM(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare ELSE 0 END) as GrossEarnings,
          SUM(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare * (1 - d.CommissionRate / 100) ELSE 0 END) as NetEarnings,
          SUM(CASE WHEN r.RideStatus = 'Completed' THEN r.Distance ELSE NULL END) as TotalDistance,
          AVG(CASE WHEN r.RideStatus = 'Completed' THEN r.Fare ELSE NULL END) as AverageFare
        FROM RIDES r
        JOIN DRIVERS d ON r.DriverID = d.DriverID
        WHERE r.DriverID = ? 
          AND r.StartTime >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
        GROUP BY DATE(r.StartTime)
        ORDER BY Date DESC
      `, [driver.DriverID]);
      data = earningsData;
      filename = `earnings-${new Date().toISOString().split('T')[0]}`;
      break;
      
    case 'performance':
      // Get performance metrics
      const [performanceData] = await db.query(`
        SELECT 
          r.RideID,
          DATE(r.StartTime) as Date,
          r.RideStatus,
          r.Fare,
          r.Distance,
          TIMESTAMPDIFF(MINUTE, r.StartTime, IFNULL(r.EndTime, NOW())) as DurationMinutes,
          rating.Score as Rating
        FROM RIDES r
        LEFT JOIN RATINGS rating ON r.RideID = rating.RideID
        WHERE r.DriverID = ? 
          AND r.StartTime >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
        ORDER BY r.StartTime DESC
      `, [driver.DriverID]);
      data = performanceData;
      filename = `performance-${new Date().toISOString().split('T')[0]}`;
      break;
      
    case 'forecast':
      // Get forecast data
      const forecast = await getEarningsForecast(req, res);
      data = forecast.data.data.Forecast || [];
      filename = `forecast-${new Date().toISOString().split('T')[0]}`;
      break;
      
    default:
      return sendError(res, 'Invalid export type', 400);
  }

  // Set response headers
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.${format}"`);
  
  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify(data, null, 2));
  } else {
    // CSV format
    res.setHeader('Content-Type', 'text/csv');
    
    if (data.length === 0) {
      return res.send('No data available');
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle CSV escaping
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    return res.send(csvContent);
  }
});

module.exports = {
  getEarningsOverview,
  getDailyEarnings,
  getWeeklyEarnings,
  getMonthlyEarnings,
  getPerformanceMetrics,
  getPerformanceTrends,
  getLocationHotspots,
  getPopularRoutes,
  getPeakHours,
  getPeakDays,
  getEarningsForecast,
  exportAnalytics
};
