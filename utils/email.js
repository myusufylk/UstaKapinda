const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === '465',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Send verification email
const sendVerificationEmail = async (email, token) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
    
    const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Verify Your Email - Usta Kapında',
        html: `
            <h1>Welcome to Usta Kapında!</h1>
            <p>Please click the link below to verify your email address:</p>
            <a href="${verificationUrl}">${verificationUrl}</a>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw new Error('Failed to send verification email');
    }
};

// Send password reset email
const sendPasswordResetEmail = async (email, token) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    
    const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Reset Your Password - Usta Kapında',
        html: `
            <h1>Password Reset Request</h1>
            <p>You requested to reset your password. Click the link below to proceed:</p>
            <a href="${resetUrl}">${resetUrl}</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw new Error('Failed to send password reset email');
    }
};

// Send job notification email
const sendJobNotificationEmail = async (email, jobDetails) => {
    const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: 'New Job Opportunity - Usta Kapında',
        html: `
            <h1>New Job Available!</h1>
            <p>A new job matching your skills has been posted:</p>
            <h2>${jobDetails.title}</h2>
            <p>${jobDetails.description}</p>
            <p>Location: ${jobDetails.location.city}</p>
            <p>Budget: ${jobDetails.budget}</p>
            <a href="${process.env.FRONTEND_URL}/jobs/${jobDetails._id}">View Job Details</a>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending job notification email:', error);
        throw new Error('Failed to send job notification email');
    }
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendJobNotificationEmail
}; 