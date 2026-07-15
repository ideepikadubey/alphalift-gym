const Lead = require('../models/Lead');
const { ErrorHandler } = require('../middleware/error');

// @desc    Get all leads
// @route   GET /api/v1/leads
// @access  Private (Admin)
exports.getLeads = async (req, res, next) => {
    try {
        const { status, source, search, page = 1, limit = 20 } = req.query;

        const query = {};

        if (status) {
            query.status = status;
        }

        if (source) {
            query.source = source;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { 'contact.phone': { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const leads = await Lead.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate('assignedTo', 'fullName email');

        const total = await Lead.countDocuments(query);

        res.status(200).json({
            success: true,
            count: leads.length,
            total,
            data: leads
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single lead
// @route   GET /api/v1/leads/:id
// @access  Private (Admin)
exports.getLead = async (req, res, next) => {
    try {
        const lead = await Lead.findById(req.params.id).populate('assignedTo', 'fullName email');

        if (!lead) {
            return next(new ErrorHandler('Lead not found', 404));
        }

        res.status(200).json({
            success: true,
            data: lead
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create lead
// @route   POST /api/v1/leads
// @access  Private (Admin)
exports.createLead = async (req, res, next) => {
    try {
        const lead = await Lead.create(req.body);

        res.status(201).json({
            success: true,
            data: lead
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update lead
// @route   PUT /api/v1/leads/:id
// @access  Private (Admin)
exports.updateLead = async (req, res, next) => {
    try {
        let lead = await Lead.findById(req.params.id);

        if (!lead) {
            return next(new ErrorHandler('Lead not found', 404));
        }

        lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: lead
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete lead
// @route   DELETE /api/v1/leads/:id
// @access  Private (Admin)
exports.deleteLead = async (req, res, next) => {
    try {
        const lead = await Lead.findById(req.params.id);

        if (!lead) {
            return next(new ErrorHandler('Lead not found', 404));
        }

        await lead.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Lead deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create lead from external webhooks (Zapier, Meta Ads, Google Ads)
// @route   POST /api/v1/leads/external
// @access  Public (Requires API Key Verification)
exports.createLeadExternal = async (req, res, next) => {
    try {
        // API Key verification
        const apiKeyHeader = req.headers['x-api-key'];
        const configuredApiKey = process.env.LEADS_API_KEY || 'alphalift_leads_secret_key';

        if (!apiKeyHeader || apiKeyHeader !== configuredApiKey) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or missing API key in x-api-key header'
            });
        }

        const { name, phone, email, source, notes } = req.body;

        if (!name || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Name and Phone number are required'
            });
        }

        const lead = await Lead.create({
            name,
            contact: {
                phone,
                email
            },
            source: source || 'other',
            notes: notes || 'Submitted via external webhook integration'
        });

        res.status(201).json({
            success: true,
            message: 'Lead received and saved successfully',
            data: lead
        });
    } catch (error) {
        next(error);
    }
};
