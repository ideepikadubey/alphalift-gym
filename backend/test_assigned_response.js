const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('./models/Member');

const JWT_SECRET = 'GYM@5111';

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/gym_erp');
  const member = await mongoose.model('Member').findOne({ 'contact.phone': '9876543321' });
  if (!member) {
    console.error('Member not found');
    process.exit(1);
  }
  
  console.log(`Testing for member: ${member.firstName} ${member.lastName} (${member._id})`);
  const token = jwt.sign({ id: member._id }, JWT_SECRET, { expiresIn: '1d' });
  
  try {
    const wRes = await axios.get('http://localhost:4000/api/v1/workouts/my-workout', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Workouts Response:', JSON.stringify(wRes.data, null, 2));
    
    const dRes = await axios.get('http://localhost:4000/api/v1/diets/my-diet', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Diets Response:', JSON.stringify(dRes.data, null, 2));
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
  process.exit(0);
}

test().catch(console.error);
