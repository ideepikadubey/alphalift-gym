const mongoose = require('mongoose');
require('./models/Member');
require('./models/Membership');
require('./models/WorkoutPlan');
require('./models/DietPlan');

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/gym_erp');
  
  // Find Member
  const member = await mongoose.model('Member').findOne({ 'contact.phone': '9876543321' });
  if (!member) {
    console.log('❌ Member with phone 9876543321 not found!');
    process.exit(1);
  }
  
  const memberId = member._id;
  console.log(`👤 Member Found: ${member.firstName} ${member.lastName} (${memberId})`);
  
  // Find Membership
  const memberships = await mongoose.model('Membership').find({ member: memberId }).populate('plan');
  console.log('\n💳 Memberships count:', memberships.length);
  memberships.forEach(m => {
    console.log(`- Plan: ${m.plan?.planName || 'No Plan'}, Status: ${m.status}, Payment Status: ${m.payment?.status}`);
  });
  
  // Find Workouts
  const workouts = await mongoose.model('WorkoutPlan').find({
    'assignedTo.member': memberId
  });
  console.log('\n🏋️ Assigned Workouts count:', workouts.length);
  workouts.forEach(w => {
    console.log(`- Workout: ${w.planName}, isTemplate: ${w.isTemplate}`);
    const assignment = w.assignedTo.find(a => a.member.toString() === memberId.toString());
    console.log(`  Assignment info: status=${assignment?.status}, startDate=${assignment?.startDate}`);
  });

  // Find Diets
  const diets = await mongoose.model('DietPlan').find({
    'assignedTo.member': memberId
  });
  console.log('\n🍽 Assigned Diets count:', diets.length);
  diets.forEach(d => {
    console.log(`- Diet: ${d.planName || d.name}, isTemplate: ${d.isTemplate}`);
    const assignment = d.assignedTo.find(a => a.member.toString() === memberId.toString());
    console.log(`  Assignment info: status=${assignment?.status}, startDate=${assignment?.startDate}`);
  });

  process.exit(0);
}

check().catch(console.error);
