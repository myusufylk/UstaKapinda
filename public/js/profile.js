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
        // Dükkan açık/kapalı durumu
        const isOpenInput = document.getElementById('isOpen');
        if(isOpenInput) {
            formData.set('isOpen', isOpenInput.checked ? 'true' : 'false');
        }
        // Şifre değiştirme alanı aktifse eski ve yeni şifreyi gönder
        const oldPassword = document.getElementById('oldPassword');
        const newPassword = document.getElementById('password');
        if(oldPassword && oldPassword.value) {
            formData.append('oldPassword', oldPassword.value);
        }
        if(newPassword && newPassword.value) {
            formData.append('password', newPassword.value);
        }
        // Sunucuya gönder
        const token = localStorage.getItem('token');
        const res = await fetch('/api/profile', {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData
        });
        if(res.ok) {
            alert('Profil başarıyla güncellendi!');
            // Şifre alanlarını temizle
            if(oldPassword) oldPassword.value = '';
            if(newPassword) newPassword.value = '';
        } else {
            alert('Bir hata oluştu!');
        }
    });
}

// Sayfa yüklendiğinde profil bilgilerini çek ve formu doldur
window.addEventListener('DOMContentLoaded', async function() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/profile', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if(res.ok) {
            const data = await res.json();
            document.getElementById('name').value = data.name || '';
            document.getElementById('email').value = data.email || '';
            document.getElementById('phone').value = data.phone || '';
            // Kullanıcı tipi kontrolü (dükkan değilse alanları gizle)
            if(!Array.isArray(data.services) || (data.services.length === 0 && !data.isOpen)) {
                const isOpenGroup = document.getElementById('isOpen')?.closest('.profile-form-group');
                if(isOpenGroup) isOpenGroup.style.display = 'none';
                const servicesList = document.querySelector('.services-list');
                if(servicesList) servicesList.style.display = 'none';
            }
            // Şifre değiştirme alanını her zaman aktif yap
            const passwordGroup = document.getElementById('passwordGroup');
            const passwordFields = document.getElementById('passwordFields');
            if(passwordGroup && passwordFields) {
                passwordGroup.classList.add('password-active');
                passwordFields.style.display = 'flex';
            }
            // Dükkan açık/kapalı durumu
            if(document.getElementById('isOpen')) {
                document.getElementById('isOpen').checked = data.isOpen !== false;
                document.getElementById('isOpenLabel').textContent = (data.isOpen !== false) ? 'Açık' : 'Kapalı';
            }
            // Profil fotoğrafı varsa göster
            if(data.photo) {
                photoPreview.src = data.photo;
                photoPreview.style.display = 'block';
            }
            // Hizmetler (checkboxlar)
            if(Array.isArray(data.services)) {
                data.services.forEach(service => {
                    const cb = document.querySelector('input[name=\"services\"][value=\"'+service+'\"]');
                    if(cb) cb.checked = true;
                });
            }
        }
    } catch (err) {
        console.error('Profil adı yüklenemedi:', err);
    }
    // Checkbox değişince label güncelle
    const isOpenInput = document.getElementById('isOpen');
    if(isOpenInput) {
        isOpenInput.addEventListener('change', function() {
            document.getElementById('isOpenLabel').textContent = this.checked ? 'Açık' : 'Kapalı';
        });
    }
}); 