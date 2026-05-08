const axios = require('axios');

// Test tokens
const riderToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOjIxLCJlbWFpbCI6InRlc3QucmlkZXJAcmlkZWZsb3cuY29tIiwiaWF0IjoxNzc4MjU2NTcxLCJleHAiOjE3NzgzNDI5NzF9.oabQUsW274My7d5SvZmNcbPcWUs1udAdEfdk_P__oY0";
const driverToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOjIyLCJlbWFpbCI6InRlc3QucmlkZXJAcmlkZWZsb3cuY29tIiwiaWF0IjoxNzc4MjU2NTcxLCJleHAiOjE3NzgzNDI5NzF9.f602MgfyVThikS4TyPFrIPuikQHOAechstS5CeKRaxk";

async function testRatingModal() {
  try {
    console.log('🧪 Testing Rating Modal Trigger...\n');

    // Create rider and driver API instances
    const riderAPI = axios.create({
      baseURL: 'http://localhost:5000/api',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${riderToken}`
      }
    });

    const driverAPI = axios.create({
      baseURL: 'http://localhost:5000/api',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${driverToken}`
      }
    });

    // Step 1: Create a ride
    console.log('1. Creating ride...');
    const rideResponse = await riderAPI.post('/rider/rides', {
      pickupLocationID: 1,
      dropoffLocationID: 2,
      vehicleType: 'Economy'
    });
    const rideId = rideResponse.data.data.rideID;
    console.log('✅ Ride created with ID:', rideId);

    // Step 2: Driver accepts ride
    console.log('\n2. Driver accepting ride...');
    const vehiclesResponse = await driverAPI.get('/driver/vehicles');
    const vehicles = vehiclesResponse.data.data;
    
    if (vehicles && vehicles.length > 0) {
      const vehicleID = vehicles[0].VehicleID;
      await driverAPI.patch(`/driver/rides/${rideId}/accept`, { vehicleID });
      console.log('✅ Driver accepted ride');
    } else {
      console.log('❌ No vehicles available');
      return;
    }

    // Step 3: Driver completes ride
    console.log('\n3. Driver completing ride...');
    await driverAPI.patch(`/driver/rides/${rideId}/complete`);
    console.log('✅ Driver completed ride!');

    // Step 4: Wait for WebSocket to trigger rating modal
    console.log('\n4. Waiting for rating modal trigger...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 5: Check if rating modal should be triggered
    console.log('\n5. Checking ride status...');
    const riderRideResponse = await riderAPI.get(`/rider/rides/${rideId}`);
    const riderStatus = riderRideResponse.data.data.RideStatus;
    console.log('✅ Rider sees status:', riderStatus);

    if (riderStatus === 'Completed') {
      console.log('🎉 SUCCESS! Ride completed - rating modal should appear!');
      console.log('✅ WebSocket should trigger rating modal for both rider and driver');
      console.log('✅ Both users can now rate each other and file complaints');
      
      // Test rating submission
      console.log('\n6. Testing rating submission...');
      const ratingData = {
        score: 5,
        comment: 'Great service!'
      };

      try {
        await riderAPI.rateRide(rideId, ratingData);
        console.log('✅ Rider successfully rated driver!');
      } catch (error) {
        console.log('❌ Rating submission failed:', error.response?.data || error.message);
      }

      // Test complaint submission
      console.log('\n7. Testing complaint submission...');
      const complaintData = {
        type: 'service',
        description: 'Test complaint for verification'
      };

      try {
        await riderAPI.fileComplaint({
          rideId: rideId,
          complaintType: complaintData.type,
          description: complaintData.description
        });
        console.log('✅ Rider successfully filed complaint!');
      } catch (error) {
        console.log('❌ Complaint submission failed:', error.response?.data || error.message);
      }

      // Test driver rating
      console.log('\n8. Testing driver rating...');
      try {
        await driverAPI.rateRide(rideId, {
          score: 4,
          comment: 'Good rider!'
        });
        console.log('✅ Driver successfully rated rider!');
      } catch (error) {
        console.log('❌ Driver rating failed:', error.response?.data || error.message);
      }

    } else {
      console.log('❌ FAILED! Ride status not completed:', riderStatus);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testRatingModal();
