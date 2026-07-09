const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('./models/Member');

const JWT_SECRET = 'GYM@5111';

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/gym_erp');
  const member = await mongoose.model('Member').findOne();
  if (!member) {
    console.error('No member found in DB to test with.');
    process.exit(1);
  }
  
  console.log(`Found member: ${member.firstName} ${member.lastName} (${member._id})`);
  const token = jwt.sign({ id: member._id }, JWT_SECRET, { expiresIn: '1d' });
  
  const endpoints = [
    { name: 'getMyMembership', url: 'http://localhost:4000/api/v1/memberships/my-membership' },
    { name: 'getMyWorkout', url: 'http://localhost:4000/api/v1/workouts/my-workout' },
    { name: 'getMyDiet', url: 'http://localhost:4000/api/v1/diets/my-diet' },
    { name: 'getLiveOccupancy', url: 'http://localhost:4000/api/v1/attendance/occupancy' },
    { name: 'getAnnouncements', url: 'http://localhost:4000/api/v1/announcements' },
    { name: 'getPlans', url: 'http://localhost:4000/api/v1/plans' }
  ];

  for (const ep of endpoints) {
    try {
      const res = await axios.get(ep.url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`✅ ${ep.name} - Status: ${res.status}`);
    } catch (err) {
      if (err.response) {
        console.error(`❌ ${ep.name} - Failed! Status: ${err.response.status}, Message:`, err.response.data?.message || err.response.data);
      } else {
        console.error(`❌ ${ep.name} - Failed! Error:`, err.message);
      }
    }
  }
  process.exit(0);
}

test().catch(console.error);
