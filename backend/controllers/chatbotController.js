const ChatbotConversation = require('../models/ChatbotConversation');
const Member = require('../models/Member');
const Membership = require('../models/Membership');
const Trainer = require('../models/Trainer');
const WorkoutPlan = require('../models/WorkoutPlan');
const DietPlan = require('../models/DietPlan');
const { ErrorHandler } = require('../middleware/error');

// Simple intent mapping (replace with actual NLP/AI service)
const intentHandlers = {
    // Member intents
    'membership_status': async (userId) => {
        const membership = await Membership.findOne({
            member: userId,
            status: 'active',
            endDate: { $gte: new Date() }
        }).populate('plan');

        if (!membership) {
            return {
                response: "I couldn't find an active membership. Please contact the admin for assistance.",
                entities: { membership: null }
            };
        }

        const daysLeft = Math.ceil((membership.endDate - new Date()) / (1000 * 60 * 60 * 24));

        return {
            response: `Your ${membership.plan.planName} membership is active until ${membership.endDate.toDateString()}. You have ${daysLeft} days remaining.`,
            entities: { membership, daysLeft }
        };
    },

    'membership_expiry': async (userId) => {
        const membership = await Membership.findOne({
            member: userId,
            endDate: { $gte: new Date() }
        }).populate('plan');

        if (!membership) {
            return {
                response: "I couldn't find your membership details. Please contact reception.",
                entities: null
            };
        }

        const daysLeft = Math.ceil((membership.endDate - new Date()) / (1000 * 60 * 60 * 24));

        if (daysLeft <= 7) {
            return {
                response: `⚠️ Your membership expires in ${daysLeft} days! Please renew soon to continue your fitness journey.`,
                entities: { daysLeft, urgent: true }
            };
        } else {
            return {
                response: `Your membership expires on ${membership.endDate.toDateString()}, ${daysLeft} days from now.`,
                entities: { daysLeft, urgent: false }
            };
        }
    },

    'workout_plan': async (userId) => {
        const workouts = await WorkoutPlan.find({
            'assignedTo.member': userId
        }).populate('trainer', 'firstName lastName');

        if (workouts.length === 0) {
            return {
                response: "You don't have any workout plans assigned yet. Please contact your trainer.",
                entities: null
            };
        }

        const activeWorkout = workouts[0];
        return {
            response: `Your current workout plan is "${activeWorkout.planName}" by trainer ${activeWorkout.trainer?.fullName || 'N/A'}. It's a ${activeWorkout.difficultyLevel} level ${activeWorkout.planType.replace('_', ' ')} program.`,
            entities: { workout: activeWorkout }
        };
    },

    'diet_plan': async (userId) => {
        const diets = await DietPlan.find({
            'assignedTo.member': userId
        }).populate('trainer', 'firstName lastName');

        if (diets.length === 0) {
            return {
                response: "You don't have any diet plans assigned yet. Please contact your trainer for a personalized diet plan.",
                entities: null
            };
        }

        const activeDiet = diets[0];
        return {
            response: `Your current diet plan is "${activeDiet.planName}" - a ${activeDiet.planType.replace('_', ' ')} plan with ${activeDiet.nutritionTargets?.dailyCalories || 'N/A'} calories per day.`,
            entities: { diet: activeDiet }
        };
    },

    'trainer_info': async (userId) => {
        const member = await Member.findById(userId).populate('assignedTrainer');

        if (!member.assignedTrainer) {
            return {
                response: "You don't have a personal trainer assigned yet. Visit our reception to get one!",
                entities: null
            };
        }

        const trainer = member.assignedTrainer;
        return {
            response: `Your personal trainer is ${trainer.fullName}. Specializations: ${trainer.specialization?.join(', ') || 'General fitness'}. Experience: ${trainer.experienceYears} years.`,
            entities: { trainer }
        };
    },

    'payment_status': async (userId) => {
        const membership = await Membership.findOne({
            member: userId
        }).sort({ createdAt: -1 });

        if (!membership) {
            return {
                response: "No payment records found. Please contact the admin.",
                entities: null
            };
        }

        if (membership.payment.status === 'paid') {
            return {
                response: `✅ Your latest payment of ₹${membership.payment.finalAmount} has been successfully processed on ${membership.payment.paidAt?.toDateString() || 'N/A'}.`,
                entities: { payment: membership.payment }
            };
        } else {
            return {
                response: `⚠️ Your payment of ₹${membership.payment.finalAmount} is still pending. Please complete your payment to activate/renew your membership.`,
                entities: { payment: membership.payment, pending: true }
            };
        }
    },

    'gym_timings': async () => {
        return {
            response: "🏋️ Gym Timings:\nMonday-Saturday: 6:00 AM - 10:00 PM\nSunday: 7:00 AM - 9:00 PM\n\nGroup classes: 6:00-7:00 AM, 6:00-7:00 PM",
            entities: { timings: true }
        };
    },

    'contact_support': async () => {
        return {
            response: "📞 Contact Support:\nReception: +91-XXXXXXXXXX\nEmail: support@gym.com\nWhatsApp: +91-XXXXXXXXXX\n\nWe're here to help!",
            entities: { support: true }
        };
    }
};

// @desc    Send message to chatbot
// @route   POST /api/v1/chatbot/message
// @access  Private
exports.sendMessage = async (req, res, next) => {
    try {
        const { message, sessionId } = req.body;
        const userId = req.admin.id; // Or member/trainer ID based on auth
        const userType = 'Admin'; // Dynamic based on auth context

        if (!message || !sessionId) {
            return next(new ErrorHandler('Message and session ID are required', 400));
        }

        // Simple keyword-based intent detection (replace with NLP service)
        const lowerMessage = message.toLowerCase();
        let intent = 'general';
        let handler = intentHandlers.general;

        // Detect intent
        if (lowerMessage.includes('membership') && (lowerMessage.includes('status') || lowerMessage.includes('active'))) {
            intent = 'membership_status';
        } else if (lowerMessage.includes('expir')) {
            intent = 'membership_expiry';
        } else if (lowerMessage.includes('workout') || lowerMessage.includes('exercise')) {
            intent = 'workout_plan';
        } else if (lowerMessage.includes('diet') || lowerMessage.includes('food') || lowerMessage.includes('meal')) {
            intent = 'diet_plan';
        } else if (lowerMessage.includes('trainer') || lowerMessage.includes('coach')) {
            intent = 'trainer_info';
        } else if (lowerMessage.includes('payment') || lowerMessage.includes('pay') || lowerMessage.includes('fee')) {
            intent = 'payment_status';
        } else if (lowerMessage.includes('timing') || lowerMessage.includes('hour') || lowerMessage.includes('open')) {
            intent = 'gym_timings';
        } else if (lowerMessage.includes('contact') || lowerMessage.includes('help') || lowerMessage.includes('support')) {
            intent = 'contact_support';
        }

        // Execute intent handler
        const handlerFn = intentHandlers[intent] || intentHandlers.general;
        const result = await handlerFn(userId);

        // Save conversation
        const conversation = await ChatbotConversation.create({
            user: userId,
            userType,
            sessionId,
            messages: [
                { role: 'user', content: message },
                { role: 'assistant', content: result.response }
            ],
            intent,
            entities: result.entities
        });

        res.status(200).json({
            success: true,
            data: {
                response: result.response,
                intent,
                entities: result.entities,
                conversationId: conversation._id
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get conversation history
// @route   GET /api/v1/chatbot/history
// @access  Private
exports.getConversationHistory = async (req, res, next) => {
    try {
        const { sessionId, limit = 10 } = req.query;
        const userId = req.admin.id;
        const userType = 'Admin';

        let query = {
            user: userId,
            userType
        };

        if (sessionId) {
            query.sessionId = sessionId;
        }

        const conversations = await ChatbotConversation.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            count: conversations.length,
            data: conversations
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get conversation by session
// @route   GET /api/v1/chatbot/session/:sessionId
// @access  Private
exports.getSessionConversation = async (req, res, next) => {
    try {
        const conversations = await ChatbotConversation.find({
            user: req.admin.id,
            userType: 'Admin',
            sessionId: req.params.sessionId
        })
            .sort({ createdAt: 1 });

        // Flatten messages
        const messages = conversations.flatMap(conv => conv.messages);

        res.status(200).json({
            success: true,
            data: {
                sessionId: req.params.sessionId,
                messages,
                totalMessages: messages.length
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Clear chatbot history
// @route   DELETE /api/v1/chatbot/history
// @access  Private
exports.clearHistory = async (req, res, next) => {
    try {
        const { sessionId } = req.query;

        let query = {
            user: req.admin.id,
            userType: 'Admin'
        };

        if (sessionId) {
            query.sessionId = sessionId;
        }

        await ChatbotConversation.deleteMany(query);

        res.status(200).json({
            success: true,
            message: sessionId ? 'Session history cleared' : 'All history cleared'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get chatbot analytics
// @route   GET /api/v1/chatbot/analytics
// @access  Private (Admin)
exports.getChatbotAnalytics = async (req, res, next) => {
    try {
        const totalConversations = await ChatbotConversation.countDocuments();

        const byIntent = await ChatbotConversation.aggregate([
            {
                $group: {
                    _id: '$intent',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        const recentActivity = await ChatbotConversation.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalConversations,
                byIntent,
                recentActivity
            }
        });
    } catch (error) {
        next(error);
    }
};