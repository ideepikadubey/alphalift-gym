const Progress = require('../models/Progress');
const Member = require('../models/Member');
const { ErrorHandler } = require('../middleware/error');

// @desc    Record member progress
// @route   POST /api/v1/progress
// @access  Private (Trainer)
exports.recordProgress = async (req, res, next) => {
    try {
        const { memberId, measurements, vitalStats, notes, recordedDate } = req.body;

        // Verify member exists
        const member = await Member.findById(memberId);
        if (!member) {
            return next(new ErrorHandler('Member not found', 404));
        }

        const progress = await Progress.create({
            member: memberId,
            recordedDate: recordedDate || new Date(),
            measurements,
            vitalStats,
            notes,
            recordedBy: req.admin.id,
            photos: req.body.photos
        });

        // Update member's current stats
        if (measurements) {
            member.physicalStats = {
                ...member.physicalStats,
                ...measurements
            };
            await member.save();
        }

        res.status(201).json({
            success: true,
            data: progress
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get member progress history
// @route   GET /api/v1/progress/member/:memberId
// @access  Private
exports.getMemberProgress = async (req, res, next) => {
    try {
        const { limit = 20 } = req.query;

        const progress = await Progress.getProgressHistory(
            req.params.memberId,
            parseInt(limit)
        );

        if (!progress || progress.length === 0) {
            return res.status(200).json({
                success: true,
                count: 0,
                data: []
            });
        }

        // Calculate progress deltas
        const latest = progress[0];
        const oldest = progress[progress.length - 1];

        const delta = {
            weight: latest.measurements.weightKg - (oldest.measurements.weightKg || 0),
            bodyFat: latest.measurements.bodyFatPercentage - (oldest.measurements.bodyFatPercentage || 0),
            muscleMass: latest.measurements.muscleMassKg - (oldest.measurements.muscleMassKg || 0)
        };

        res.status(200).json({
            success: true,
            count: progress.length,
            data: {
                progress,
                delta
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all progress records
// @route   GET /api/v1/progress
// @access  Private (Admin)
exports.getAllProgress = async (req, res, next) => {
    try {
        const { memberId, startDate, endDate } = req.query;

        let query = {};

        if (memberId) query.member = memberId;

        if (startDate || endDate) {
            query.recordedDate = {};
            if (startDate) query.recordedDate.$gte = new Date(startDate);
            if (endDate) query.recordedDate.$lte = new Date(endDate);
        }

        const progress = await Progress.find(query)
            .populate('member', 'firstName lastName')
            .populate('recordedBy', 'firstName lastName')
            .sort({ recordedDate: -1 });

        res.status(200).json({
            success: true,
            count: progress.length,
            data: progress
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single progress record
// @route   GET /api/v1/progress/:id
// @access  Private
exports.getProgress = async (req, res, next) => {
    try {
        const progress = await Progress.findById(req.params.id)
            .populate('member', 'firstName lastName')
            .populate('recordedBy', 'firstName lastName');

        if (!progress) {
            return next(new ErrorHandler('Progress record not found', 404));
        }

        res.status(200).json({
            success: true,
            data: progress
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update progress record
// @route   PUT /api/v1/progress/:id
// @access  Private (Trainer/Admin)
exports.updateProgress = async (req, res, next) => {
    try {
        const progress = await Progress.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        ).populate('member recordedBy');

        if (!progress) {
            return next(new ErrorHandler('Progress record not found', 404));
        }

        res.status(200).json({
            success: true,
            data: progress
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete progress record
// @route   DELETE /api/v1/progress/:id
// @access  Private (Admin)
exports.deleteProgress = async (req, res, next) => {
    try {
        const progress = await Progress.findById(req.params.id);

        if (!progress) {
            return next(new ErrorHandler('Progress record not found', 404));
        }

        await progress.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Progress record deleted'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get progress analytics
// @route   GET /api/v1/progress/analytics
// @access  Private (Admin)
exports.getProgressAnalytics = async (req, res, next) => {
    try {
        const { memberId, months = 6 } = req.query;

        const monthsAgo = new Date();
        monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(months));

        let matchQuery = {
            recordedDate: { $gte: monthsAgo }
        };

        if (memberId) {
            matchQuery.member = memberId;
        }

        const analytics = await Progress.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: {
                        member: '$member',
                        month: {
                            $dateToString: { format: '%Y-%m', date: '$recordedDate' }
                        }
                    },
                    avgWeight: { $avg: '$measurements.weightKg' },
                    avgBodyFat: { $avg: '$measurements.bodyFatPercentage' },
                    avgBmi: { $avg: '$measurements.bmi' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.month': 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: analytics
        });
    } catch (error) {
        next(error);
    }
};