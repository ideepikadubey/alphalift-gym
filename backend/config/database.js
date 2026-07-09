const mongoose = require('mongoose');


const connectDB = async () => {
    try {
        // Use hardcoded connection string for testing
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gym_erp';

        const conn = await mongoose.connect(mongoUri);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📦 Database: ${conn.connection.name}`);

        // Self-healing check for legacy memberships that do not have Payment documents
        const Membership = require('../models/Membership');
        const Payment = require('../models/Payment');
        
        const memberships = await Membership.find({});
        console.log(`🔍 Checking ${memberships.length} memberships for missing payment records...`);
        let createdPayments = 0;
        
        for (const ms of memberships) {
            // Check if there is already a Payment for this membership
            const exists = await Payment.findOne({ membership: ms._id });
            if (!exists) {
                // Determine payment status
                const status = ms.payment?.status === 'paid' || ms.status === 'active' ? 'success' : 'pending';
                const finalAmt = ms.payment?.finalAmount || ms.payment?.totalAmount || 0;
                
                await Payment.create({
                    membership: ms._id,
                    member: ms.member,
                    amount: finalAmt,
                    paymentMethod: ms.payment?.method || 'cash',
                    status: status,
                    transactionId: ms.payment?.transactionId || `TXN_LEGACY_${ms._id}`,
                    paymentDate: ms.payment?.paidAt || ms.createdAt || new Date()
                });
                createdPayments++;
            }
        }
        if (createdPayments > 0) {
            console.log(`✅ Database Self-Healed: Created ${createdPayments} missing Payment documents.`);
        } else {
            console.log(`✅ All memberships have corresponding Payment records.`);
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;