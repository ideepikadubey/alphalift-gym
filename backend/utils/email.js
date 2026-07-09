const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Create reusable transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.NODE_ENV === 'production', // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

// Send email
const sendEmail = async (options) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments || []
    };

    await transporter.sendMail(mailOptions);
};

// Email templates
const emailTemplates = {
    // Membership payment receipt
    paymentReceipt: (data) => ({
        subject: `Payment Receipt - ${data.membershipId}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9f9f9; }
                    .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                    .btn { display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Payment Receipt</h1>
                    </div>
                    <div class="content">
                        <p>Dear ${data.memberName},</p>
                        <p>Thank you for your payment! Your membership has been activated/renewed.</p>
                        
                        <div class="details">
                            <h3>Payment Details:</h3>
                            <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
                            <p><strong>Amount Paid:</strong> ₹${data.amount}</p>
                            <p><strong>Payment Date:</strong> ${new Date(data.paymentDate).toDateString()}</p>
                            <p><strong>Membership Plan:</strong> ${data.planName}</p>
                            <p><strong>Valid Until:</strong> ${new Date(data.endDate).toDateString()}</p>
                        </div>
                        
                        <p>You can access all gym facilities and services with your active membership.</p>
                        
                        ${data.downloadInvoice ? `
                            <p style="text-align: center; margin: 20px 0;">
                                <a href="${data.invoiceUrl}" class="btn">Download Invoice</a>
                            </p>
                        ` : ''}
                        
                        <p>For any queries, please contact us at ${process.env.EMAIL_FROM} or ${process.env.PHONE_SUPPORT}</p>
                    </div>
                    <div class="footer">
                        <p>${process.env.GYM_NAME} - Building Your Fitness Journey</p>
                        <p>${process.env.GYM_ADDRESS}</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
            Dear ${data.memberName},
            
            Thank you for your payment of ₹${data.amount}!
            
            Transaction ID: ${data.transactionId}
            Membership Plan: ${data.planName}
            Valid Until: ${new Date(data.endDate).toDateString()}
            
            For any queries, contact us at ${process.env.EMAIL_FROM}
            
            ${process.env.GYM_NAME}
        `
    }),

    // Membership expiry reminder
    membershipExpiry: (data) => ({
        subject: '⚠️ Membership Expiry Reminder',
        html: `
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: #FF9800; color: white; padding: 20px; text-align: center;">
                        <h1>Membership Expiry Alert</h1>
                    </div>
                    <div style="padding: 20px; background: #fff3e0;">
                        <p>Dear ${data.memberName},</p>
                        <p style="color: #d32f2f; font-weight: bold;">
                            Your membership will expire in ${data.daysLeft} days on ${new Date(data.endDate).toDateString()}
                        </p>
                        <p>Don't let your fitness journey get interrupted! Renew your membership now to continue enjoying:</p>
                        <ul>
                            ${data.features.map(f => `<li>${f}</li>`).join('')}
                        </ul>
                        <p style="text-align: center; margin: 20px 0;">
                            <a href="${data.renewalUrl}" style="display: inline-block; padding: 12px 30px; background: #FF9800; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Renew Now</a>
                        </p>
                        <p>Questions? Contact us at ${process.env.EMAIL_FROM}</p>
                    </div>
                    <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
                        <p>${process.env.GYM_NAME}</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
            Dear ${data.memberName},
            
            ALERT: Your membership expires in ${data.daysLeft} days (${new Date(data.endDate).toDateString()})
            
            Renew now to continue your fitness journey!
            Visit: ${data.renewalUrl}
            
            ${process.env.GYM_NAME}
        `
    }),

    // Birthday wishes
    birthdayWishes: (data) => ({
        subject: '🎉 Happy Birthday from Gym Family!',
        html: `
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px;">
                        <h1>🎉 Happy Birthday! 🎂</h1>
                        <h2>Dear ${data.memberName}</h2>
                    </div>
                    <div style="padding: 20px;">
                        <p>Wishing you a year filled with health, happiness, and fitness achievements!</p>
                        <p>Here's to another year of crushing your fitness goals! 💪</p>
                        <p style="margin: 20px 0;">
                            <strong>🎁 Birthday Special:</strong> Get 20% off on your next membership renewal!
                            Use code: <strong>BDAY20</strong>
                        </p>
                        <p>Enjoy your special day!</p>
                        <p style="margin-top: 30px;">
                            ${process.env.GYM_NAME} Family
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
            Happy Birthday ${data.memberName}! 🎉
            
            Wishing you a year of health and fitness!
            
            Special offer: Use code BDAY20 for 20% off on renewal.
            
            ${process.env.GYM_NAME} Family
        `
    }),

    // Workout assigned notification
    workoutAssigned: (data) => ({
        subject: 'New Workout Plan Assigned! 💪',
        html: `
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: #2196F3; color: white; padding: 20px; text-align: center;">
                        <h1>🏋️ New Workout Plan</h1>
                    </div>
                    <div style="padding: 20px;">
                        <p>Hi ${data.memberName},</p>
                        <p>Your trainer ${data.trainerName} has assigned you a new workout plan!</p>
                        <div style="background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #2196F3;">
                            <h3>${data.workoutName}</h3>
                            <p><strong>Type:</strong> ${data.planType}</p>
                            <p><strong>Difficulty:</strong> ${data.difficultyLevel}</p>
                            <p><strong>Duration:</strong> ${data.durationWeeks} weeks</p>
                        </div>
                        <p style="text-align: center;">
                            <a href="${data.viewUrl}" style="display: inline-block; padding: 10px 20px; background: #2196F3; color: white; text-decoration: none; border-radius: 5px;">View Workout Plan</a>
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
            Hi ${data.memberName},
            
            Your trainer ${data.trainerName} has assigned you a new workout plan: ${data.workoutName}
            
            View it at: ${data.viewUrl}
            
            ${process.env.GYM_NAME}
        `
    })
};

// Send email with template
exports.sendEmail = async (options) => {
    try {
        const { to, template, data, subject, html, text } = options;

        let emailOptions = { to };

        // Use template if provided
        if (template && emailTemplates[template]) {
            emailOptions = { ...emailOptions, ...emailTemplates[template](data) };
        } else {
            emailOptions.subject = subject;
            emailOptions.html = html;
            emailOptions.text = text;
        }

        await sendEmail(emailOptions);

        console.log(`Email sent to ${to}`);
        return { success: true, message: 'Email sent successfully' };
    } catch (error) {
        console.error('Email send error:', error);
        throw error;
    }
};

// Bulk email send (for notifications)
exports.sendBulkEmail = async (recipients, template, data) => {
    const results = [];

    for (const recipient of recipients) {
        try {
            await sendEmail({
                to: recipient.email,
                ...emailTemplates[template]({ ...data, memberName: recipient.name })
            });
            results.push({ email: recipient.email, success: true });
        } catch (error) {
            results.push({ email: recipient.email, success: false, error: error.message });
        }
    }

    return results;
};