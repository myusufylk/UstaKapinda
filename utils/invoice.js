const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { sendInvoiceEmail } = require('./email');

const createInvoice = async (payment) => {
    return new Promise(async (resolve, reject) => {
        try {
            const invoicePath = path.join(__dirname, '../invoices', `${payment.invoiceNumber}.pdf`);
            const doc = new PDFDocument();

            // Create invoices directory if it doesn't exist
            if (!fs.existsSync(path.join(__dirname, '../invoices'))) {
                fs.mkdirSync(path.join(__dirname, '../invoices'));
            }

            // Create write stream
            const stream = fs.createWriteStream(invoicePath);
            doc.pipe(stream);

            // Add company logo
            doc.image(path.join(__dirname, '../public/images/logo.png'), 50, 45, { width: 50 })
                .moveDown();

            // Add company info
            doc.fontSize(20)
                .text('Usta Kapında', 110, 57)
                .fontSize(10)
                .text('Adres: İstanbul, Türkiye', 110, 80)
                .text('Telefon: +90 212 123 4567', 110, 95)
                .text('Email: info@ustakapinda.com', 110, 110)
                .moveDown();

            // Add invoice info
            doc.fontSize(16)
                .text('FATURA', 50, 160)
                .fontSize(10)
                .text(`Fatura No: ${payment.invoiceNumber}`, 50, 180)
                .text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 50, 195)
                .moveDown();

            // Add client info
            doc.text('Müşteri Bilgileri:', 50, 230)
                .text(`İsim: ${payment.client.name}`, 50, 245)
                .text(`Email: ${payment.client.email}`, 50, 260)
                .text(`Telefon: ${payment.client.phone}`, 50, 275)
                .moveDown();

            // Add job details
            doc.text('İş Detayları:', 50, 310)
                .text(`İş Başlığı: ${payment.job.title}`, 50, 325)
                .text(`Açıklama: ${payment.job.description}`, 50, 340)
                .moveDown();

            // Add payment details
            doc.text('Ödeme Detayları:', 50, 380)
                .text(`Tutar: ${payment.amount} ${payment.currency}`, 50, 395)
                .text(`Ödeme Yöntemi: ${payment.paymentMethod}`, 50, 410)
                .text(`Durum: ${payment.status}`, 50, 425)
                .moveDown();

            // Add footer
            doc.fontSize(8)
                .text('Bu bir bilgisayar çıktısıdır, imza gerektirmez.', 50, 700)
                .text('© 2024 Usta Kapında. Tüm hakları saklıdır.', 50, 715);

            // Finalize PDF
            doc.end();

            // Wait for stream to finish
            stream.on('finish', async () => {
                // Update payment with invoice URL
                payment.invoiceUrl = `/invoices/${payment.invoiceNumber}.pdf`;
                await payment.save();

                // Send invoice email
                await sendInvoiceEmail(payment.client.email, {
                    invoiceNumber: payment.invoiceNumber,
                    invoiceUrl: payment.invoiceUrl,
                    amount: payment.amount,
                    currency: payment.currency
                });

                resolve({
                    invoiceNumber: payment.invoiceNumber,
                    invoiceUrl: payment.invoiceUrl
                });
            });

            stream.on('error', (error) => {
                reject(error);
            });
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    createInvoice
}; 