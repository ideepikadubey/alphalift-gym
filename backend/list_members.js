const mongoose = require('mongoose');
require('./models/Member');

async function list() {
  await mongoose.connect('mongodb://127.0.0.1:27017/gym_erp');
  const members = await mongoose.model('Member').find();
  console.log('Total members in DB:', members.length);
  members.forEach(m => {
    console.log(`- ${m.firstName} ${m.lastName} (${m._id}) - Phone: ${m.contact?.phone} / ${m.phone}`);
  });
  process.exit(0);
}

list().catch(console.error);
