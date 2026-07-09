const Member = require('../models/Member');
const Membership = require('../models/Membership');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const Trainer = require('../models/Trainer');

// @desc    Get admin dashboard stats
// @route   GET /api/v1/dashboard
// @access  Private (Admin)
exports.getDashboardStats = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Fetch all stats in parallel using Promise.all to avoid sequential awaits and round-trip delay
        const [
            totalMembers,
            newMembersThisMonth,
            activeMemberships,
            expiringSoon,
            currentMonthRevenue,
            totalRevenue,
            todayCheckIns,
            totalTrainers
        ] = await Promise.all([
            Member.countDocuments({ isActive: true }),
            Member.countDocuments({
                isActive: true,
                joinedDate: {
                    $gte: new Date(today.getFullYear(), today.getMonth(), 1)
                }
            }),
            Membership.countDocuments({
                status: 'active',
                endDate: { $gte: new Date() }
            }),
            Membership.countDocuments({
                status: 'active',
                endDate: {
                    $gte: new Date(),
                    $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                },
                autoRenew: false
            }),
            Payment.aggregate([
                {
                    $match: {
                        status: 'success',
                        paymentDate: {
                            $gte: new Date(today.getFullYear(), today.getMonth(), 1),
                            $lt: tomorrow
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' }
                    }
                }
            ]),
            Payment.aggregate([
                { $match: { status: 'success' } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' }
                    }
                }
            ]),
            Attendance.countDocuments({
                'checkIn.time': { $gte: today, $lt: tomorrow }
            }),
            Trainer.countDocuments({ isActive: true })
        ]);

        res.status(200).json({
            success: true,
            data: {
                members: {
                    total: totalMembers,
                    newThisMonth: newMembersThisMonth
                },
                memberships: {
                    active: activeMemberships,
                    expiringSoon
                },
                revenue: {
                    thisMonth: currentMonthRevenue[0]?.total || 0,
                    total: totalRevenue[0]?.total || 0
                },
                attendance: {
                    today: todayCheckIns
                },
                trainers: {
                    total: totalTrainers
                }
            }
        });
    } catch (error) {
        next(error);
    }
};