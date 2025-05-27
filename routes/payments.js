const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const Job = require('../models/Job');
const { auth, checkRole } = require('../middleware/auth');
const { createInvoice } = require('../utils/invoice');

// Create payment intent
router.post('/create-intent', auth, async (req, res) => {
    try {
        const { jobId, amount } = req.body;

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ error: 'İş bulunamadı' });
        }

        // Check if user is the client
        if (job.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
        }

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Convert to cents
            currency: 'try',
            metadata: {
                jobId: job._id.toString(),
                clientId: req.user._id.toString(),
                craftsmanId: job.craftsman.toString()
            }
        });

        res.json({
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        res.status(500).json({ error: 'Ödeme başlatılırken bir hata oluştu' });
    }
});

// Confirm payment
router.post('/confirm', auth, async (req, res) => {
    try {
        const { paymentIntentId, jobId } = req.body;

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({ error: 'Ödeme başarısız' });
        }

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ error: 'İş bulunamadı' });
        }

        // Create payment record
        const payment = new Payment({
            job: job._id,
            client: req.user._id,
            craftsman: job.craftsman,
            amount: paymentIntent.amount / 100,
            paymentIntentId: paymentIntent.id,
            status: 'completed'
        });

        await payment.save();

        // Update job status
        job.status = 'completed';
        job.completionDetails = {
            ...job.completionDetails,
            finalPrice: payment.amount,
            completionDate: new Date()
        };
        await job.save();

        // Create and send invoice
        const invoice = await createInvoice(payment);
        await sendInvoiceEmail(req.user.email, invoice);

        res.json({
            message: 'Ödeme başarıyla tamamlandı',
            payment
        });
    } catch (error) {
        res.status(500).json({ error: 'Ödeme onaylanırken bir hata oluştu' });
    }
});

// Get payment history
router.get('/history', auth, async (req, res) => {
    try {
        const payments = await Payment.find({
            $or: [
                { client: req.user._id },
                { craftsman: req.user._id }
            ]
        })
        .populate('job', 'title')
        .populate('client', 'name')
        .populate('craftsman', 'user')
        .sort('-createdAt');

        res.json(payments);
    } catch (error) {
        res.status(500).json({ error: 'Ödeme geçmişi alınırken bir hata oluştu' });
    }
});

// Get payment details
router.get('/:id', auth, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('job', 'title')
            .populate('client', 'name')
            .populate('craftsman', 'user');

        if (!payment) {
            return res.status(404).json({ error: 'Ödeme bulunamadı' });
        }

        // Check if user is involved in the payment
        if (payment.client.toString() !== req.user._id.toString() &&
            payment.craftsman.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Bu ödemeye erişim izniniz yok' });
        }

        res.json(payment);
    } catch (error) {
        res.status(500).json({ error: 'Ödeme detayları alınırken bir hata oluştu' });
    }
});

// Request refund
router.post('/:id/refund', auth, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        
        if (!payment) {
            return res.status(404).json({ error: 'Ödeme bulunamadı' });
        }

        // Check if user is the client
        if (payment.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
        }

        // Check if payment is eligible for refund
        if (payment.status !== 'completed' || payment.refundRequested) {
            return res.status(400).json({ error: 'Bu ödeme için iade talep edilemez' });
        }

        // Create refund request
        const refund = await stripe.refunds.create({
            payment_intent: payment.paymentIntentId,
            reason: req.body.reason
        });

        payment.refundRequested = true;
        payment.refundStatus = 'pending';
        payment.refundReason = req.body.reason;
        await payment.save();

        res.json({
            message: 'İade talebi oluşturuldu',
            refund
        });
    } catch (error) {
        res.status(500).json({ error: 'İade talebi oluşturulurken bir hata oluştu' });
    }
});

module.exports = router; 