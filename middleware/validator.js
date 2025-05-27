const { body, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// User validation rules
const userValidationRules = () => {
    return [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long'),
        body('phone').notEmpty().withMessage('Phone number is required')
    ];
};

// Job validation rules
const jobValidationRules = () => {
    return [
        body('title').trim().notEmpty().withMessage('Title is required'),
        body('description').trim().notEmpty().withMessage('Description is required'),
        body('category').isMongoId().withMessage('Valid category ID is required'),
        body('budget').isNumeric().withMessage('Budget must be a number'),
        body('location.address').notEmpty().withMessage('Address is required'),
        body('location.city').notEmpty().withMessage('City is required'),
        body('schedule.preferredDate').isISO8601().withMessage('Valid date is required')
    ];
};

// Craftsman validation rules
const craftsmanValidationRules = () => {
    return [
        body('profession').trim().notEmpty().withMessage('Profession is required'),
        body('experience').isNumeric().withMessage('Experience must be a number'),
        body('hourlyRate').isNumeric().withMessage('Hourly rate must be a number'),
        body('serviceArea').isArray().withMessage('Service area must be an array')
    ];
};

// Review validation rules
const reviewValidationRules = () => {
    return [
        body('rating')
            .isInt({ min: 1, max: 5 })
            .withMessage('Puan 1 ile 5 arasında olmalıdır'),
        body('comment')
            .trim()
            .isLength({ min: 10, max: 500 })
            .withMessage('Yorum 10 ile 500 karakter arasında olmalıdır'),
        body('jobId')
            .isMongoId()
            .withMessage('Geçersiz iş ID\'si'),
        body('craftsmanId')
            .isMongoId()
            .withMessage('Geçersiz usta ID\'si')
    ];
};

module.exports = {
    validate,
    userValidationRules,
    jobValidationRules,
    craftsmanValidationRules,
    reviewValidationRules
}; 