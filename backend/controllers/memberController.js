const Member = require('../models/Member');
const Membership = require('../models/Membership');
const { ErrorHandler } = require('../middleware/error');
const APIFeatures = require('../utils/apiFeatures');

// @desc    Get all members
// @route   GET /api/v1/members
// @access  Private (Admin)
exports.getAllMembers = async (req, res, next) => {
    try {
        let query = {};
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            query.$or = [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { 'contact.phone': searchRegex },
                { 'contact.email': searchRegex }
            ];
        }

        // Restrict list for trainers to only their assigned members
        if (req.admin && req.admin.role === 'trainer') {
            const Trainer = require('../models/Trainer');
            const trainerProfile = await Trainer.findOne({ 'contact.phone': req.admin.username });
            if (trainerProfile) {
                query.assignedTrainer = trainerProfile._id;
            } else {
                const mongoose = require('mongoose');
                query.assignedTrainer = new mongoose.Types.ObjectId();
            }
        }

        const queryObj = { ...req.query };
        delete queryObj.search;

        const features = new APIFeatures(Member.find(query), queryObj)
            .filter()
            .sort()
            .limitFields()
            .paginate();

        // Run counting and querying in parallel to improve performance
        const [total, members] = await Promise.all([
            Member.countDocuments(query),
            features.query.populate('referredBy', 'firstName lastName contact.phone')
        ]);

        res.status(200).json({
            success: true,
            total,
            count: members.length,
            data: members
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single member
// @route   GET /api/v1/members/:id
// @access  Private
exports.getMember = async (req, res, next) => {
    try {
        const member = await Member.findById(req.params.id)
            .populate('referredBy', 'firstName lastName contact.phone');

        if (!member) {
            return next(new ErrorHandler('Member not found', 404));
        }

        // Get active membership
        const activeMembership = await Membership.findOne({
            member: member._id,
            status: 'active',
            endDate: { $gte: new Date() }
        }).populate('plan assignedTrainer');

        res.status(200).json({
            success: true,
            data: {
                member,
                activeMembership
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create member
// @route   POST /api/v1/members
// @access  Private (Admin/Receptionist)
exports.createMember = async (req, res, next) => {
    try {
        const member = await Member.create(req.body);

        res.status(201).json({
            success: true,
            data: member
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update member
// @route   PUT /api/v1/members/:id
// @access  Private
exports.updateMember = async (req, res, next) => {
    try {
        const member = await Member.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!member) {
            return next(new ErrorHandler('Member not found', 404));
        }

        res.status(200).json({
            success: true,
            data: member
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete member (hard delete)
// @route   DELETE /api/v1/members/:id
// @access  Private (Admin)
exports.deleteMember = async (req, res, next) => {
    try {
        const member = await Member.findById(req.params.id);

        if (!member) {
            return next(new ErrorHandler('Member not found', 404));
        }

        await member.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Member deleted permanently'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get member statistics
// @route   GET /api/v1/members/stats
// @access  Private (Admin)
exports.getMemberStats = async (req, res, next) => {
    try {
        const totalMembers = await Member.countDocuments({ isActive: true });

        const activeMemberships = await Membership.countDocuments({
            status: 'active',
            endDate: { $gte: new Date() }
        });

        const expiringSoon = await Membership.countDocuments({
            status: 'active',
            endDate: {
                $gte: new Date(),
                $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
            },
            autoRenew: false
        });

        const genderDistribution = await Member.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$gender', count: { $sum: 1 } } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalMembers,
                activeMemberships,
                expiringSoon,
                genderDistribution
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Search members
// @route   GET /api/v1/members/search
// @access  Private
exports.searchMembers = async (req, res, next) => {
    try {
        const { query } = req.query;

        if (!query) {
            return next(new ErrorHandler('Search query is required', 400));
        }

        const queryObj = {
            isActive: true,
            $or: [
                { firstName: { $regex: query, $options: 'i' } },
                { lastName: { $regex: query, $options: 'i' } },
                { 'contact.phone': { $regex: query, $options: 'i' } },
                { 'contact.email': { $regex: query, $options: 'i' } }
            ]
        };

        if (req.admin && req.admin.role === 'trainer') {
            const Trainer = require('../models/Trainer');
            const trainerProfile = await Trainer.findOne({ 'contact.phone': req.admin.username });
            if (trainerProfile) {
                queryObj.assignedTrainer = trainerProfile._id;
            } else {
                const mongoose = require('mongoose');
                queryObj.assignedTrainer = new mongoose.Types.ObjectId();
            }
        }

        const members = await Member.find(queryObj).limit(20);

        res.status(200).json({
            success: true,
            count: members.length,
            data: members
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Approve member self-registration
// @route   PUT /api/v1/members/:id/approve
// @access  Private (Admin)
exports.approveMember = async (req, res, next) => {
    try {
        const member = await Member.findById(req.params.id);
        if (!member) {
            return next(new ErrorHandler('Member not found', 404));
        }

        member.approvalStatus = 'approved';
        member.isActive = true;
        await member.save();

        res.status(200).json({
            success: true,
            message: 'Member approved successfully',
            data: member
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reject member self-registration
// @route   PUT /api/v1/members/:id/reject
// @access  Private (Admin)
exports.rejectMember = async (req, res, next) => {
    try {
        const member = await Member.findById(req.params.id);
        if (!member) {
            return next(new ErrorHandler('Member not found', 404));
        }

        member.approvalStatus = 'rejected';
        member.isActive = false;
        await member.save();

        res.status(200).json({
            success: true,
            message: 'Member registration rejected',
            data: member
        });
    } catch (error) {
        next(error);
    }
};