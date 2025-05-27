const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'İsim alanı zorunludur'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'E-posta alanı zorunludur'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Geçerli bir e-posta adresi giriniz']
    },
    phone: {
        type: String,
        required: [true, 'Telefon alanı zorunludur'],
        match: [/^[0-9]{10}$/, 'Geçerli bir telefon numarası giriniz']
    },
    password: {
        type: String,
        required: [true, 'Şifre alanı zorunludur'],
        minlength: [6, 'Şifre en az 6 karakter olmalıdır'],
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'craftsman', 'admin'],
        default: 'user'
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    profileImage: {
        type: String,
        default: 'default.jpg'
    },
    address: {
        street: String,
        city: String,
        district: String,
        zipCode: String
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number]
        }
    },
    preferences: {
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            push: {
                type: Boolean,
                default: true
            },
            sms: {
                type: Boolean,
                default: true
            }
        },
        language: {
            type: String,
            enum: ['tr', 'en'],
            default: 'tr'
        }
    },
    favoriteCraftsmen: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Craftsman'
    }],
    recentSearches: [{
        keyword: String,
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category'
        },
        city: String,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    jobHistory: [{
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Job'
        },
        status: String,
        completedAt: Date
    }],
    paymentHistory: [{
        payment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Payment'
        },
        amount: Number,
        date: Date
    }],
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
    }],
    lastLogin: {
        type: Date
    },
    loginHistory: [{
        date: Date,
        ip: String,
        device: String
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: String,
    twoFactorRecoveryCodes: [String]
}, {
    timestamps: true
});

// Konum bazlı sorgular için index
userSchema.index({ location: '2dsphere' });

// Şifre hashleme
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// JWT token oluşturma
userSchema.methods.getSignedJwtToken = function() {
    return jwt.sign(
        { id: this._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
};

// Şifre karşılaştırma
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// E-posta doğrulama tokeni oluşturma
userSchema.methods.getEmailVerificationToken = function() {
    const verificationToken = crypto.randomBytes(20).toString('hex');

    this.emailVerificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');

    this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 saat

    return verificationToken;
};

// Şifre sıfırlama tokeni oluşturma
userSchema.methods.getResetPasswordToken = function() {
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 dakika

    return resetToken;
};

// Favori ustaları güncelle
userSchema.methods.updateFavoriteCraftsmen = async function(craftsmanId, action) {
    if (action === 'add' && !this.favoriteCraftsmen.includes(craftsmanId)) {
        this.favoriteCraftsmen.push(craftsmanId);
    } else if (action === 'remove') {
        this.favoriteCraftsmen = this.favoriteCraftsmen.filter(
            id => id.toString() !== craftsmanId.toString()
        );
    }
    await this.save();
};

// Arama geçmişini güncelle
userSchema.methods.updateSearchHistory = async function(searchData) {
    // Son 10 aramayı tut
    this.recentSearches.unshift(searchData);
    if (this.recentSearches.length > 10) {
        this.recentSearches.pop();
    }
    await this.save();
};

// İş geçmişini güncelle
userSchema.methods.updateJobHistory = async function(jobId, status) {
    const jobHistory = {
        job: jobId,
        status,
        completedAt: status === 'completed' ? new Date() : undefined
    };

    this.jobHistory.unshift(jobHistory);
    await this.save();
};

// Ödeme geçmişini güncelle
userSchema.methods.updatePaymentHistory = async function(paymentId, amount) {
    const paymentHistory = {
        payment: paymentId,
        amount,
        date: new Date()
    };

    this.paymentHistory.unshift(paymentHistory);
    await this.save();
};

// Giriş geçmişini güncelle
userSchema.methods.updateLoginHistory = async function(ip, device) {
    this.lastLogin = new Date();
    this.loginHistory.unshift({
        date: new Date(),
        ip,
        device
    });

    // Son 10 girişi tut
    if (this.loginHistory.length > 10) {
        this.loginHistory.pop();
    }

    await this.save();
};

// 2FA için kurtarma kodları oluştur
userSchema.methods.generateRecoveryCodes = function() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
        codes.push(crypto.randomBytes(4).toString('hex'));
    }
    this.twoFactorRecoveryCodes = codes;
    return codes;
};

module.exports = mongoose.model('User', userSchema); 