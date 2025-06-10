// Form kontrolü
let currentSection = 1;
const totalSections = 4;
const progressBar = document.getElementById('progressBar');

// Bölüm geçişleri
document.getElementById('nextBtn').addEventListener('click', nextSection);
document.getElementById('prevBtn').addEventListener('click', prevSection);
document.getElementById('submitBtn').addEventListener('click', submitForm);
document.getElementById('findWorkshopBtn').addEventListener('click', function() {
    const mapDiv = document.getElementById('map');
    if(mapDiv) {
        mapDiv.style.display = 'block';
        // Kullanıcının seçtiği arıza türüne göre ilgili dükkan tipini belirle
        const faultSymptom = document.getElementById('faultSymptom').value;
        let shopType = 'genel';
        if(faultSymptom === 'engine' || faultSymptom === 'mechanical') {
            shopType = 'mekanik';
        } else if(faultSymptom === 'electrical') {
            shopType = 'elektrik';
        } else if(faultSymptom === 'other') {
            shopType = 'genel';
        }
        if(window.initRepairMap) window.initRepairMap(shopType);
    }
});

// Dinamik alanlar
document.getElementById('faultSymptom').addEventListener('change', function() {
    const speedLabel = document.getElementById('speedLabel');
    const speedInput = document.getElementById('carSpeed');
    if (speedLabel && speedInput) {
        if(this.value === 'collision') {
            speedLabel.style.display = 'block';
            speedInput.style.display = 'block';
        } else {
            speedLabel.style.display = 'none';
            speedInput.style.display = 'none';
        }
    }
});

document.getElementById('engineIssue').addEventListener('change', function() {
    document.getElementById('engineDetails').style.display = this.value === 'yes' ? 'block' : 'none';
});

document.getElementById('electricalIssue').addEventListener('change', function() {
    document.getElementById('electricalDetails').style.display = this.value === 'yes' ? 'block' : 'none';
});

// Fotoğraf önizleme
document.getElementById('photoUpload').addEventListener('change', function() {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';
    if(this.files.length < 3) {
        preview.innerHTML = '<p style="color: red;">Lütfen en az 3 fotoğraf yükleyin</p>';
        return;
    }
    for(let i = 0; i < this.files.length; i++) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            preview.appendChild(img);
        }
        reader.readAsDataURL(this.files[i]);
    }
});

// İlerleme çubuğu güncelleme
function updateProgress() {
    const progress = (currentSection / totalSections) * 100;
    progressBar.style.width = `${progress}%`;
}

// Sonraki bölüm
function nextSection() {
    if(!validateSection(currentSection)) return;
    document.getElementById(`section${currentSection}`).style.display = 'none';
    currentSection++;
    document.getElementById(`section${currentSection}`).style.display = 'block';
    document.getElementById('prevBtn').style.display = currentSection > 1 ? 'inline-block' : 'none';
    document.getElementById('nextBtn').style.display = currentSection < totalSections ? 'inline-block' : 'none';
    document.getElementById('submitBtn').style.display = currentSection === totalSections ? 'inline-block' : 'none';
    updateProgress();
}

// Önceki bölüm
function prevSection() {
    document.getElementById(`section${currentSection}`).style.display = 'none';
    currentSection--;
    document.getElementById(`section${currentSection}`).style.display = 'block';
    document.getElementById('prevBtn').style.display = currentSection > 1 ? 'inline-block' : 'none';
    document.getElementById('nextBtn').style.display = 'inline-block';
    document.getElementById('submitBtn').style.display = 'none';
    updateProgress();
}

// Bölüm doğrulama
function validateSection(section) {
    if(section === 1) {
        const brand = document.getElementById('carBrand').value;
        const model = document.getElementById('carModel').value;
        const year = document.getElementById('carYear').value;
        if(!brand || !model || !year) {
            alert('Lütfen araç bilgilerini eksiksiz doldurun');
            return false;
        }
    }
    if(section === 2) {
        const cause = document.getElementById('faultSymptom').value;
        const description = document.getElementById('faultDescription').value.trim();
        if(!cause) {
            alert('Lütfen arızanın belirtisini belirtin');
            return false;
        }
        if(!description) {
            alert('Lütfen arızayı detaylı açıklayın');
            return false;
        }
    }
    if(section === 4) {
        const photos = document.getElementById('photoUpload').files;
        if(photos.length < 3) {
            alert('Lütfen en az 3 fotoğraf yükleyin');
            return false;
        }
    }
    return true;
}

// Form gönderimi
function submitForm(e) {
    e.preventDefault();
    if(!validateSection(currentSection)) return;
    // Arıza türünü belirle
    const faultSymptom = document.getElementById('faultSymptom').value;
    let faultType = 'genel';
    if(faultSymptom === 'engine' || faultSymptom === 'mechanical') {
        faultType = 'mekanik';
    } else if(faultSymptom === 'electrical') {
        faultType = 'elektrik';
    } else if(faultSymptom === 'other') {
        faultType = 'genel';
    }
    // Sonuç ekranını göster
    document.getElementById('faultForm').style.display = 'none';
    document.getElementById('faultResult').style.display = 'block';
    // Sonuç içeriğini doldur
    const resultContent = document.getElementById('resultContent');
    resultContent.innerHTML = `
        <p><strong>Araç Bilgisi:</strong> ${document.getElementById('carBrand').options[document.getElementById('carBrand').selectedIndex].text} ${document.getElementById('carModel').value} (${document.getElementById('carYear').value})</p>
        <p><strong>Arıza Türü:</strong> ${faultType === 'mekanik' ? 'Mekanik Problem' : faultType === 'elektrik' ? 'Elektrik Arızası' : 'Genel Arıza'}</p>
        <p><strong>Arıza Açıklaması:</strong> ${document.getElementById('faultDescription').value}</p>
        <p><strong>Tahmini Tamir Kategorisi:</strong> ${getRepairCategory(faultType)}</p>
        <p><strong>Önerilen Tamirci Sayısı:</strong> ${getRecommendedWorkshops(faultType).length}</p>
    `;
}

// Tamir kategorisi belirleme
function getRepairCategory(type) {
    if(type === 'mekanik') {
        return 'Yetkili Servis veya Motor/Mekanik Uzmanı';
    } else if(type === 'elektrik') {
        return 'Oto Elektrikçi';
    }
    return 'Genel Tamirci';
}

// Önerilen tamirciler (mock data)
function getRecommendedWorkshops(type) {
    const workshops = [
        {name: "Oto Motor Tamir", expertise: ["mekanik"], distance: "1.2 km"},
        {name: "Kaporta Center", expertise: ["karoseri"], distance: "0.8 km"},
        {name: "Camcı Ali Usta", expertise: ["genel", "cam"], distance: "2.1 km"},
        {name: "Total Car Care", expertise: ["mekanik", "karoseri", "genel"], distance: "3.5 km"},
        {name: "Elektrikçi Mehmet", expertise: ["elektrik"], distance: "1.5 km"}
    ];
    return workshops.filter(ws => ws.expertise.includes(type));
} 