const Attendance = require('../models/Attendance');
const Membership = require('../models/Membership');
const Member = require('../models/Member');
const { ErrorHandler } = require('../middleware/error');

// @desc    Check-in member
// @route   POST /api/v1/attendance/checkin
// @access  Private (Receptionist/Trainer)
exports.checkIn = async (req, res, next) => {
    try {
        const { memberId, membershipId, checkInMethod = 'manual', sessionType = 'gym' } = req.body;

        // Verify member exists
        const member = await Member.findById(memberId);
        if (!member) {
            return next(new ErrorHandler('Member not found', 404));
        }

        if (!member.isActive) {
            return next(new ErrorHandler('Member account is inactive', 400));
        }

        // Verify membership
        let membership = membershipId
            ? await Membership.findById(membershipId)
            : await Membership.findOne({
                member: memberId,
                status: 'active',
                endDate: { $gte: new Date() }
            });

        if (!membership) {
            return next(new ErrorHandler('No active membership found for this member', 400));
        }

        // Check if already checked in today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existingCheckIn = await Attendance.findOne({
            member: memberId,
            'checkIn.time': { $gte: today, $lt: tomorrow },
            checkOut: { $exists: false }
        });

        if (existingCheckIn) {
            return next(new ErrorHandler('Member already checked in today', 400));
        }

        // Create attendance record
        const attendance = await Attendance.create({
            member: memberId,
            membership: membership._id,
            checkIn: {
                time: new Date(),
                method: checkInMethod
            },
            session: {
                type: sessionType,
                trainer: req.body.trainerId || null
            }
        });

        // Increment attendance count in membership
        membership.attendanceCount += 1;
        await membership.save();

        // Create notification for admin
        const Notification = require('../models/Notification');
        await Notification.create({
            recipient: req.admin._id,
            recipientType: 'Admin',
            title: 'Member Checked In',
            message: `${member.fullName} checked in for ${sessionType} session.`,
            type: 'system',
            priority: 'low',
            sentAt: new Date()
        });

        res.status(201).json({
            success: true,
            message: 'Check-in successful',
            data: attendance
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Check-out member
// @route   POST /api/v1/attendance/checkout
// @access  Private (Receptionist/Trainer)
exports.checkOut = async (req, res, next) => {
    try {
        const { attendanceId, checkOutMethod = 'manual' } = req.body;

        const attendance = await Attendance.findById(attendanceId);

        if (!attendance) {
            return next(new ErrorHandler('Attendance record not found', 404));
        }

        if (attendance.checkOut && attendance.checkOut.time) {
            return next(new ErrorHandler('Member already checked out', 400));
        }

        attendance.checkOut = {
            time: new Date(),
            method: checkOutMethod
        };

        // Calculate duration
        attendance.calculateDuration();

        await attendance.save();

        // Create notification for admin
        const member = await Member.findById(attendance.member);
        const Notification = require('../models/Notification');
        await Notification.create({
            recipient: req.admin._id,
            recipientType: 'Admin',
            title: 'Member Checked Out',
            message: `${member ? member.fullName : 'Member'} checked out.`,
            type: 'system',
            priority: 'low',
            sentAt: new Date()
        });

        res.status(200).json({
            success: true,
            message: 'Check-out successful',
            data: attendance
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get today's attendance
// @route   GET /api/v1/attendance/today
// @access  Private
exports.getTodayAttendance = async (req, res, next) => {
    try {
        const attendance = await Attendance.getTodayAttendance();

        res.status(200).json({
            success: true,
            count: attendance.length,
            data: attendance
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get attendance records
// @route   GET /api/v1/attendance
// @access  Private
exports.getAllAttendance = async (req, res, next) => {
    try {
        const { memberId, startDate, endDate, status } = req.query;

        let query = {};

        if (memberId) query.member = memberId;
        if (status) query.status = status;

        if (startDate || endDate) {
            query['checkIn.time'] = {};
            if (startDate) query['checkIn.time'].$gte = new Date(startDate);
            if (endDate) query['checkIn.time'].$lte = new Date(endDate);
        }

        const attendance = await Attendance.find(query)
            .populate('member', 'firstName lastName contact.phone')
            .populate('membership', 'plan status')
            .populate('session.trainer', 'firstName lastName')
            .sort({ 'checkIn.time': -1 });

        res.status(200).json({
            success: true,
            count: attendance.length,
            data: attendance
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get member attendance history
// @route   GET /api/v1/attendance/member/:memberId
// @access  Private
exports.getMemberAttendance = async (req, res, next) => {
    try {
        const { memberId } = req.params;
        const limit = req.query.limit || 30;

        const attendance = await Attendance.find({ member: memberId })
            .sort({ 'checkIn.time': -1 })
            .limit(limit)
            .populate('membership', 'plan status');

        // Calculate stats
        const totalVisits = attendance.length;
        const thisMonth = attendance.filter(a => {
            const checkIn = new Date(a.checkIn.time);
            const now = new Date();
            return checkIn.getMonth() === now.getMonth() && checkIn.getFullYear() === now.getFullYear();
        }).length;

        res.status(200).json({
            success: true,
            data: {
                attendance,
                stats: {
                    totalVisits,
                    visitsThisMonth: thisMonth
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get attendance statistics
// @route   GET /api/v1/attendance/stats
// @access  Private (Admin)
exports.getAttendanceStats = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Today's stats
        const todayCheckIns = await Attendance.countDocuments({
            'checkIn.time': { $gte: today, $lt: tomorrow }
        });

        const currentlyInGym = await Attendance.countDocuments({
            'checkIn.time': { $gte: today, $lt: tomorrow },
            checkOut: { $exists: true }
        });

        // Weekly stats (last 7 days)
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const weeklyStats = await Attendance.aggregate([
            {
                $match: {
                    'checkIn.time': { $gte: weekAgo, $lt: tomorrow }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$checkIn.time' }
                    },
                    checkIns: { $sum: 1 },
                    uniqueMembers: { $addToSet: '$member' }
                }
            },
            {
                $project: {
                    date: '$_id',
                    checkIns: 1,
                    uniqueMembers: { $size: '$uniqueMembers' }
                }
            },
            { $sort: { date: 1 } }
        ]);

        // Peak hours analysis
        const peakHours = await Attendance.aggregate([
            {
                $match: {
                    'checkIn.time': { $gte: weekAgo, $lt: tomorrow }
                }
            },
            {
                $group: {
                    _id: { $hour: '$checkIn.time' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        res.status(200).json({
            success: true,
            data: {
                today: {
                    checkIns: todayCheckIns,
                    currentlyInGym
                },
                weekly: weeklyStats,
                peakHours: peakHours
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update attendance record
// @route   PUT /api/v1/attendance/:id
// @access  Private (Admin)
exports.updateAttendance = async (req, res, next) => {
    try {
        const attendance = await Attendance.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        ).populate('member membership');

        if (!attendance) {
            return next(new ErrorHandler('Attendance record not found', 404));
        }

        res.status(200).json({
            success: true,
            data: attendance
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete attendance record
// @route   DELETE /api/v1/attendance/:id
// @access  Private (Admin)
exports.deleteAttendance = async (req, res, next) => {
    try {
        const attendance = await Attendance.findById(req.params.id);

        if (!attendance) {
            return next(new ErrorHandler('Attendance record not found', 404));
        }

        await attendance.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Attendance record deleted'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    QR Check-in / Check-out toggle with auto-registration support
// @route   POST /api/v1/attendance/qr-scan
// @access  Private (Admin/Receptionist/Trainer)
exports.qrScan = async (req, res, next) => {
    try {
        const { memberId, phone, autoRegister = false } = req.body;

        let member = null;

        if (memberId) {
            member = await Member.findById(memberId);
        } else if (phone) {
            member = await Member.findOne({ 'contact.phone': phone });
        }

        // If member not found and autoRegister is enabled, auto-register them
        if (!member) {
            if (autoRegister && phone) {
                // Check phone format
                if (!/^[6-9]\d{9}$/.test(phone)) {
                    return res.status(400).json({
                        success: false,
                        message: 'For auto-registration, a valid 10-digit Indian mobile number is required'
                    });
                }

                // Create new member
                member = await Member.create({
                    firstName: 'Auto',
                    lastName: `Member_${phone.slice(-4)}`,
                    gender: 'other',
                    contact: { phone: phone }
                });

                // Find or create default plan
                const MembershipPlan = require('../models/MembershipPlan');
                let plan = await MembershipPlan.findOne({ isActive: true });
                if (!plan) {
                    plan = await MembershipPlan.create({
                        name: 'Trial 1 Month',
                        durationMonths: 1,
                        price: 1500,
                        description: 'Auto-generated plan for trial/walk-in members',
                        isActive: true
                    });
                }

                // Create active membership
                const startDate = new Date();
                const endDate = new Date();
                endDate.setMonth(endDate.getMonth() + plan.durationMonths);

                const Membership = require('../models/Membership');
                await Membership.create({
                    member: member._id,
                    plan: plan._id,
                    startDate,
                    endDate,
                    status: 'active',
                    payment: {
                        status: 'paid',
                        totalAmount: plan.price,
                        finalAmount: plan.price,
                        method: 'cash',
                        paidAt: new Date()
                    },
                    enrolledBy: req.admin?.id || null
                });
            } else {
                return res.status(404).json({
                    success: false,
                    memberNotFound: true,
                    message: 'Member not found. Enable auto-registration to register this member.'
                });
            }
        }

        if (!member.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Member profile is deactivated'
            });
        }

        // Check if there is an active check-in today with no check-out yet
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const activeAttendance = await Attendance.findOne({
            member: member._id,
            'checkIn.time': { $gte: today, $lt: tomorrow },
            'checkOut.time': { $exists: false }
        });

        const Notification = require('../models/Notification');

        if (activeAttendance) {
            // Check out the member
            activeAttendance.checkOut = {
                time: new Date(),
                method: 'qr_code'
            };
            activeAttendance.calculateDuration();
            await activeAttendance.save();

            // Create notification for admin
            await Notification.create({
                recipient: req.admin._id,
                recipientType: 'Admin',
                title: 'QR Member Checked Out',
                message: `${member.fullName} checked out via QR scan. Duration: ${activeAttendance.session.durationMinutes} min.`,
                type: 'system',
                priority: 'low',
                sentAt: new Date()
            });

            return res.status(200).json({
                success: true,
                action: 'checkout',
                message: `${member.fullName} checked out successfully.`,
                data: activeAttendance,
                member
            });
        } else {
            // Check in the member
            // Verify active membership exists
            const Membership = require('../models/Membership');
            const membership = await Membership.findOne({
                member: member._id,
                status: 'active',
                endDate: { $gte: new Date() }
            });

            if (!membership) {
                return res.status(400).json({
                    success: false,
                    message: 'No active membership found for this member'
                });
            }

            const attendance = await Attendance.create({
                member: member._id,
                membership: membership._id,
                checkIn: {
                    time: new Date(),
                    method: 'qr_code'
                },
                session: {
                    type: 'gym',
                    trainer: null
                }
            });

            membership.attendanceCount += 1;
            await membership.save();

            // Create notification for admin
            await Notification.create({
                recipient: req.admin._id,
                recipientType: 'Admin',
                title: 'QR Member Checked In',
                message: `${member.fullName} checked in via QR scan.`,
                type: 'system',
                priority: 'low',
                sentAt: new Date()
            });

            return res.status(201).json({
                success: true,
                action: 'checkin',
                message: `${member.fullName} checked in successfully.`,
                data: attendance,
                member
            });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get live gym occupancy
// @route   GET /api/v1/attendance/occupancy
// @access  Private (Admin & Member)
exports.getLiveOccupancy = async (req, res, next) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const count = await Attendance.countDocuments({
            'checkIn.time': { $gte: startOfDay },
            'checkOut.time': { $exists: false }
        });

        res.status(200).json({
            success: true,
            occupancy: count
        });
    } catch (error) {
        next(error);
    }
};