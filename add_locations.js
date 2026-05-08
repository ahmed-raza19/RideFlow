const db = require('./rideflow-backend/config/db');

async function addLocations() {
  const newLocations = [
    // Karachi Locations
    ['Tariq Road', 'Main Tariq Road', 'Karachi', 'Sindh', '75400', 24.87920000, 67.06430000],
    ['Korangi Creek', 'Korangi Creek Road', 'Karachi', 'Sindh', '74900', 24.84370000, 67.14080000],
    ['North Nazimabad', 'Block H North Nazimabad', 'Karachi', 'Sindh', '74700', 24.93450000, 67.06730000],
    ['Defence Phase 8', 'Khayaban-e-Ittehad', 'Karachi', 'Sindh', '75500', 24.79650000, 67.06210000],
    ['Kemari', 'Kemari Town', 'Karachi', 'Sindh', '75610', 24.87850000, 66.97560000],
    ['Landhi', 'Landhi Town', 'Karachi', 'Sindh', '75150', 24.84690000, 67.20120000],
    ['Shahrah-e-Faisal', 'Shahrah-e-Faisal Main', 'Karachi', 'Sindh', '75350', 24.88320000, 67.17120000],
    ['Gulshan-e-Jamal', 'Block 10 Gulshan-e-Jamal', 'Karachi', 'Sindh', '75210', 24.91340000, 67.11850000],

    // Lahore Locations
    ['Gulberg Main Market', 'Main Boulevard Gulberg', 'Lahore', 'Punjab', '54000', 31.52540000, 74.34360000],
    ['Cantonment', 'Cantonment Area', 'Lahore', 'Punjab', '54600', 31.58210000, 74.37820000],
    ['Shalimar Gardens', 'Shalimar Garden Road', 'Lahore', 'Punjab', '54000', 31.58820000, 74.38950000],
    ['Baghbanpura', 'Baghbanpura Main Road', 'Lahore', 'Punjab', '54800', 31.60030000, 74.40120000],
    ['Ichhra', 'Ichra Market', 'Lahore', 'Punjab', '54500', 31.54870000, 74.35680000],
    ['Samnabad', 'Samnabad Main Road', 'Lahore', 'Punjab', '54370', 31.53420000, 74.33450000],
    ['Green Town', 'Green Town Main Market', 'Lahore', 'Punjab', '54850', 31.61240000, 74.41230000],
    ['Mughalpura', 'Mughalpura Railway Station', 'Lahore', 'Punjab', '54100', 31.59340000, 74.36780000],

    // Islamabad Locations
    ['Blue Area Block D', 'Jinnah Avenue Block D', 'Islamabad', 'ICT', '44000', 33.71560000, 73.08760000],
    ['F-8 Markaz', 'F-8 Super Market', 'Islamabad', 'ICT', '44000', 33.71280000, 73.02340000],
    ['F-10 Markaz', 'F-10 Super Market', 'Islamabad', 'ICT', '44000', 33.69450000, 72.99870000],
    ['I-8 Markaz', 'I-8 Markaz Main', 'Islamabad', 'ICT', '44000', 33.72340000, 73.04560000],
    ['E-11 Sector', 'E-11 Main Market', 'Islamabad', 'ICT', '44000', 33.70210000, 72.97650000],
    ['D-12 Sector', 'D-12 Main Boulevard', 'Islamabad', 'ICT', '44000', 33.68940000, 72.98760000],
    ['B-17 Sector', 'B-17 Multi Gardens', 'Islamabad', 'ICT', '44000', 33.65870000, 72.82340000],
    ['Rawat', 'GT Road Rawat', 'Islamabad', 'ICT', '44000', 33.62340000, 73.06780000],

    // Additional Cities
    ['University Road', 'University Road Peshawar', 'Peshawar', 'KPK', '25000', 34.01250000, 71.57890000],
    ['Cantonment Peshawar', 'Cantonment Board Peshawar', 'Peshawar', 'KPK', '25000', 34.02340000, 71.58920000],
    ['University Quetta', 'University of Balochistan', 'Quetta', 'Balochistan', '87300', 30.18920000, 66.98760000],
    ['Jinnah Road Quetta', 'Jinnah Road Quetta', 'Quetta', 'Balochistan', '87300', 30.19870000, 66.99540000],
    ['Mall Road Multan', 'Multan Mall Road', 'Multan', 'Punjab', '60000', 30.19840000, 71.46870000],
    ['Ghanta Ghar Multan', 'Clock Tower Multan', 'Multan', 'Punjab', '60000', 30.20760000, 71.47890000],
    ['Baba-e-Umrah', 'Baba-e-Umrah Road', 'Faisalabad', 'Punjab', '38000', 31.45020000, 73.07890000],
    ['Gumti Faisalabad', 'Gumti Chowk Faisalabad', 'Faisalabad', 'Punjab', '38000', 31.45980000, 73.08760000]
  ];

  try {
    console.log('Adding locations to database...');
    
    for (const location of newLocations) {
      await db.query(
        'INSERT INTO LOCATIONS (LocationName, Street, City, State, Zip, Latitude, Longitude) VALUES (?, ?, ?, ?, ?, ?, ?)',
        location
      );
    }
    
    console.log(`Successfully added ${newLocations.length} new locations!`);
    
    // Verify the count
    const [rows] = await db.query('SELECT COUNT(*) as count FROM LOCATIONS');
    console.log('Total locations now:', rows[0].count);
    
    // Show some sample locations
    const [sample] = await db.query('SELECT LocationID, LocationName, City FROM LOCATIONS ORDER BY LocationID DESC LIMIT 5');
    console.log('Latest added locations:', sample);
    
    process.exit(0);
  } catch (err) {
    console.error('Error adding locations:', err);
    process.exit(1);
  }
}

addLocations();
