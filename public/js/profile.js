// Profil fotoğrafı önizleme
const photoInput = document.getElementById('profilePhoto');
const photoPreview = document.getElementById('photoPreview');
if(photoInput) {
    photoInput.addEventListener('change', function() {
        if(this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                photoPreview.src = e.target.result;
                photoPreview.style.display = 'block';
            }
            reader.readAsDataURL(this.files[0]);
        }
    });
}

// Profil formu submit
const profileForm = document.getElementById('profileForm');
if(profileForm) {
    profileForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(profileForm);
        // Checkboxlar için hizmetler dizisi oluştur
        const services = [];
        profileForm.querySelectorAll('input[name="services"]:checked').forEach(cb => services.push(cb.value));
        formData.delete('services');
        services.forEach(s => formData.append('services', s));
        // Sunucuya gönder
        const res = await fetch('/api/profile', {
            method: 'POST',
            body: formData
        });
        if(res.ok) {
            alert('Profil başarıyla güncellendi!');
        } else {
            alert('Bir hata oluştu!');
        }
    });
} 