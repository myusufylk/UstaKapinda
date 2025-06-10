const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Shop = require('../models/Shop');

const auth = async (req, res, next) => {
    try {
        console.log('auth middleware çalıştı');
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) throw new Error();

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('decoded:', decoded);

        if (decoded.type === 'shop' && decoded.shopId) {
            const shop = await Shop.findById(decoded.shopId);
            if (!shop) throw new Error();
            req.token = token;
            req.user = { ...shop.toObject(), type: 'shop', shopId: shop._id };
            return next();
        }

        if (decoded.type === 'user' && decoded.userId) {
            const user = await User.findById(decoded.userId);
            if (!user) throw new Error();
            req.token = token;
            req.user = { ...user.toObject(), type: 'user', userId: user._id };
            return next();
        }

        throw new Error();
    } catch (error) {
        console.error('auth middleware hata:', error);
        res.status(401).json({ error: 'Please authenticate.' });
    }
};

const checkRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied.' });
        }
        next();
    };
};

module.exports = {
    auth,
    checkRole
}; 