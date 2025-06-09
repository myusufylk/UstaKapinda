const { body, validationResult } = require('express-validator');

// Kullanıcı validasyon kuralları
const userValidationRules = () => {
    return [
        body('name')
            .trim()
            .notEmpty().withMessage('İsim alanı zorunludur')
            .isLength({ min: 2 }).withMessage('İsim en az 2 karakter olmalıdır'),
        
        body('email')
            .trim()
            .notEmpty().withMessage('E-posta alanı zorunludur')
            .isEmail().withMessage('Geçerli bir e-posta adresi giriniz'),
        
        body('password')
            .trim()
            .notEmpty().withMessage('Şifre alanı zorunludur')
            .isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalıdır'),
        
        body('phone')
            .trim()
            .notEmpty().withMessage('Telefon alanı zorunludur')
            .matches(/^[0-9]{10}$/).withMessage('Geçerli bir telefon numarası giriniz')
    ];
};

// Dükkan validasyon kuralları
const shopValidationRules = () => {
    return [
        body('name')
            .trim()
            .notEmpty().withMessage('Dükkan adı zorunludur')
            .isLength({ min: 2 }).withMessage('Dükkan adı en az 2 karakter olmalıdır'),
        
        body('email')
            .trim()
            .notEmpty().withMessage('E-posta alanı zorunludur')
            .isEmail().withMessage('Geçerli bir e-posta adresi giriniz'),
        
        body('password')
            .trim()
            .notEmpty().withMessage('Şifre alanı zorunludur')
            .isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalıdır'),
        
        body('phone')
            .trim()
            .notEmpty().withMessage('Telefon alanı zorunludur')
            .matches(/^[0-9]{10}$/).withMessage('Geçerli bir telefon numarası giriniz'),
        
        body('address')
            .trim()
            .notEmpty().withMessage('Adres alanı zorunludur')
            .isLength({ min: 10 }).withMessage('Adres en az 10 karakter olmalıdır'),
        
        body('services')
            .isArray().withMessage('Hizmetler bir dizi olmalıdır')
            .notEmpty().withMessage('En az bir hizmet seçilmelidir')
    ];
};

// Validasyon sonuçlarını kontrol et
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    
    const extractedErrors = errors.array().map(err => ({
        field: err.param,
        message: err.msg
    }));
    
    return res.status(400).json({
        errors: extractedErrors
    });
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
    userValidationRules,
    shopValidationRules,
    validate,
    jobValidationRules,
    craftsmanValidationRules,
    reviewValidationRules
}; 