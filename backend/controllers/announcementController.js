const Announcement = require('../models/Announcement');
const { ErrorHandler } = require('../middleware/error');

// @desc    Create new announcement
// @route   POST /api/v1/announcements
// @access  Private (Admin/Staff)
exports.createAnnouncement = async (req, res, next) => {
    try {
        const { title, content, channels = ['portal'], targetAudience = 'all' } = req.body;

        if (!title || !content) {
            return next(new ErrorHandler('Title and content are required', 400));
        }

        const announcement = await Announcement.create({
            title,
            content,
            channels,
            targetAudience,
            sentBy: req.admin.id
        });

        // Dispatch WhatsApp if requested
        if (channels.includes('whatsapp')) {
            if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM) {
                try {
                    const twilio = require('twilio');
                    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
                    const Member = require('../models/Member');
                    
                    const members = await Member.find({ isActive: true });
                    
                    // Fire all WhatsApp sends asynchronously to avoid blocking the API response
                    Promise.all(members.map(async (member) => {
                        if (member.contact?.phone) {
                            try {
                                let formattedPhone = member.contact.phone;
                                if (formattedPhone.length === 10) {
                                    formattedPhone = `+91${formattedPhone}`;
                                } else if (!formattedPhone.startsWith('+')) {
                                    formattedPhone = `+${formattedPhone}`;
                                }
                                
                                await client.messages.create({
                                    from: process.env.TWILIO_WHATSAPP_FROM,
                                    to: `whatsapp:${formattedPhone}`,
                                    body: `*${title}*\n\n${content}`
                                });
                                console.log(`✅ WhatsApp broadcast sent to ${member.firstName} (${formattedPhone})`);
                            } catch (err) {
                                console.error(`❌ Failed to send WhatsApp to ${member.firstName} (${member.contact.phone}): ${err.message}`);
                            }
                        }
                    })).catch(err => console.error('Error in WhatsApp broadcast list:', err));
                } catch (err) {
                    console.error('Failed to initialize Twilio client:', err.message);
                }
            } else {
                console.log(`\n============== SIMULATED WHATSAPP BROADCAST ==============`);
                console.log(`Target Audience: ${targetAudience}`);
                console.log(`Title: ${title}`);
                console.log(`Message: ${content}`);
                console.log(`Status: DISPATCHED SUCCESSFULLY via WhatsApp API Simulation`);
                console.log(`Note: To activate real broadcasting, configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM in your backend .env file.`);
                console.log(`==========================================================\n`);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Announcement broadcasted successfully',
            data: announcement
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all announcements
// @route   GET /api/v1/announcements
// @access  Private (Admin & Member)
exports.getAnnouncements = async (req, res, next) => {
    try {
        const announcements = await Announcement.find()
            .populate('sentBy', 'fullName username')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: announcements.length,
            data: announcements
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete an announcement
// @route   DELETE /api/v1/announcements/:id
// @access  Private (Admin)
exports.deleteAnnouncement = async (req, res, next) => {
    try {
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) {
            return next(new ErrorHandler('Announcement not found', 404));
        }
        await announcement.deleteOne();
        res.status(200).json({ success: true, message: 'Announcement deleted' });
    } catch (error) {
        next(error);
    }
};
