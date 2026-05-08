const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/rider/locations',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
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
        response.data.slice(0, 5).forEach((loc, i) => {
          console.log(`  ${i+1}. ${loc.LocationName} - ${loc.City}`);
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
