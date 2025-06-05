const express = require('express');
const router = express.Router();
const path = require('path');

// Hasar tespit sayfasını göster
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/hasar-tespit.html'));
});

// Hasar tespit formunu işle
router.post('/submit', async (req, res) => {
    try {
        // Form verilerini al
        const {
            carBrand,
            carModel,
            carYear,
            damageDate,
            damageTime,
            damageCause,
            damageAreas,
            engineIssues,
            electricalIssues,
            additionalNotes
        } = req.body;

        // Hasar türünü belirle
        let damageType = 'genel';
        if (damageAreas.includes('engine') || damageAreas.includes('chassis')) {
            damageType = 'mekanik';
        } else if (damageAreas.some(area => ['frontBumper', 'rearBumper', 'rightFrontDoor', 'leftRearDoor'].includes(area))) {
            damageType = 'karoseri';
        }

        // Sonuç döndür
        res.json({
            success: true,
            data: {
                carInfo: {
                    brand: carBrand,
                    model: carModel,
                    year: carYear
                },
                damageInfo: {
                    type: damageType,
                    areas: damageAreas,
                    cause: damageCause,
                    date: damageDate,
                    time: damageTime
                },
                issues: {
                    engine: engineIssues,
                    electrical: electricalIssues
                },
                notes: additionalNotes
            }
        });
    } catch (error) {
        console.error('Hasar tespit formu işlenirken hata:', error);
        res.status(500).json({
            success: false,
            error: 'Hasar tespit formu işlenirken bir hata oluştu'
        });
    }
});

module.exports = router; 