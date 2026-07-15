const Member = require('../models/Member');
const Membership = require('../models/Membership');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const Trainer = require('../models/Trainer');
const MembershipPlan = require('../models/MembershipPlan');
const WorkoutPlan = require('../models/WorkoutPlan');
const DietPlan = require('../models/DietPlan');

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

// @desc    Perform global search across members, trainers, plans, workouts, and diets
// @route   GET /api/v1/dashboard/search
// @access  Private (Admin)
exports.globalSearch = async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(200).json({ success: true, data: {} });
        }

        const regex = new RegExp(q, 'i');

        const [members, trainers, plans, workouts, diets] = await Promise.all([
            // Search members: firstName, lastName, phone, email
            Member.find({
                $or: [
                    { firstName: regex },
                    { lastName: regex },
                    { 'contact.phone': regex },
                    { 'contact.email': regex }
                ]
            }).limit(5).select('firstName lastName contact.phone contact.email'),

            // Search trainers: firstName, lastName, phone, email, specialization
            Trainer.find({
                $or: [
                    { firstName: regex },
                    { lastName: regex },
                    { 'contact.phone': regex },
                    { 'contact.email': regex },
                    { specialization: regex }
                ]
            }).limit(5).select('firstName lastName contact.phone contact.email specialization'),

            // Search Membership Plans: name, description
            MembershipPlan.find({
                $or: [
                    { name: regex },
                    { description: regex }
                ]
            }).limit(5).select('name price duration'),

            // Search Workouts: planName, description
            WorkoutPlan.find({
                $or: [
                    { planName: regex },
                    { description: regex }
                ]
            }).limit(5).select('planName planType difficultyLevel'),

            // Search Diets: planName, description
            DietPlan.find({
                $or: [
                    { planName: regex },
                    { description: regex }
                ]
            }).limit(5).select('planName planType dailyCalories')
        ]);

        // Add fullName virtual to trainer objects in frontend-friendly format
        const formattedTrainers = trainers.map(t => ({
            _id: t._id,
            firstName: t.firstName,
            lastName: t.lastName,
            fullName: `${t.firstName} ${t.lastName}`.trim(),
            contact: t.contact,
            specialization: t.specialization
        }));

        res.status(200).json({
            success: true,
            data: {
                members,
                trainers: formattedTrainers,
                plans,
                workouts,
                diets
            }
        });
    } catch (error) {
        next(error);
    }
};