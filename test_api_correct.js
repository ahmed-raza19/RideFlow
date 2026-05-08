const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOjIsInJvbGUiOiJSaWRlciIsImlhdCI6MTc3ODI2MjMzNiwiZXhwIjoxNzc4MjY1OTM2fQ.v1dq9bJUQ5wowgWsEalYL_sk71mSoQQDNZbOI7PbFoQ';

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/rider/locations',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log(`\nFound ${response.data?.length || 0} locations from API`);
      if (response.data && response.data.length > 0) {
        console.log('Sample locations from API:');
        response.data.slice(0, 10).forEach((loc, i) => {
          console.log(`  ${i+1}. ${loc.LocationName} - ${loc.City} (${loc.Street})`);
        });
      }
    } catch (err) {
      console.error('Error parsing response:', err);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (err) => {
  console.error('Request error:', err.message);
});

req.end();
