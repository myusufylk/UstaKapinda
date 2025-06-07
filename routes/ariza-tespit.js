const express = require('express');
const router = express.Router();
const path = require('path');

// Arıza tespit sayfasını göster
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/ariza-tespit.html'));
});

// Arıza tespit formunu işle
router.post('/submit', async (req, res) => {
    try {
        // Form verilerini al
        const {
            carBrand,
            carModel,
            carYear,
            faultDate,
            faultTime,
            faultSymptom,
            faultAreas,
            engineIssues,
            electricalIssues,
            additionalNotes
        } = req.body;

        // Arıza türünü belirle
        let faultType = 'genel';
        if (faultAreas.includes('engine') || faultAreas.includes('chassis')) {
            faultType = 'mekanik';
        } else if (faultAreas.some(area => ['frontBumper', 'rearBumper', 'rightFrontDoor', 'leftRearDoor'].includes(area))) {
            faultType = 'karoseri';
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
                faultInfo: {
                    type: faultType,
                    areas: faultAreas,
                    symptom: faultSymptom,
                    date: faultDate,
                    time: faultTime
                },
                issues: {
                    engine: engineIssues,
                    electrical: electricalIssues
                },
                notes: additionalNotes
            }
        });
    } catch (error) {
        console.error('Arıza tespit formu işlenirken hata:', error);
        res.status(500).json({
            success: false,
            error: 'Arıza tespit formu işlenirken bir hata oluştu'
        });
    }
});

module.exports = router; 