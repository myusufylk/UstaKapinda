// Randevularım sayfası için script
window.addEventListener('DOMContentLoaded', async function() {
    console.log('Randevu JS yüklendi');
    const listDiv = document.getElementById('appointmentList');
    listDiv.innerHTML = '<p>Yükleniyor...</p>';
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/appointments', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if(res.ok) {
            const data = await res.json();
            console.log('API yanıtı:', data);
            const now = new Date();
            const pastAppointments = (data.data || []).filter(app => {
                const appDate = new Date(app.date);
                // Eğer randevu tarihi bugünden küçükse geçmiş randevudur
                return appDate < now;
            });
            if(pastAppointments.length > 0) {
                listDiv.innerHTML = '';
                pastAppointments.forEach(app => {
                    const item = document.createElement('div');
                    item.className = 'appointment-item';
                    // Durum etiketi için class belirle
                    let statusClass = 'status-pending';
                    if(app.status === 'confirmed') statusClass = 'status-confirmed';
                    else if(app.status === 'cancelled') statusClass = 'status-cancelled';
                    else if(app.status === 'completed') statusClass = 'status-completed';
                    item.innerHTML = `
                        <div class="appointment-header">
                            <span class="appointment-date">${new Date(app.date).toLocaleDateString('tr-TR')} ${app.startTime || ''}</span>
                            <span class="appointment-status ${statusClass}">${app.status ? app.status.charAt(0).toUpperCase() + app.status.slice(1) : 'Bilinmiyor'}</span>
                        </div>
                        <div class="appointment-detail"><span class="appointment-label">Hizmet:</span> ${app.job ? app.job.title : '-'}</div>
                        <div class="appointment-detail"><span class="appointment-label">Açıklama:</span> ${app.job ? app.job.description : '-'}</div>
                        <div class="appointment-detail"><span class="appointment-label">Usta:</span> ${app.craftsman && app.craftsman.user ? app.craftsman.user.name : '-'}</div>
                    `;
                    listDiv.appendChild(item);
                });
            } else {
                console.log('Geçmiş randevu yok');
                listDiv.innerHTML = '<div class="no-appointments" style="display:block;text-align:center;color:#888;font-size:1.1rem;margin-top:40px;">Geçmiş randevu kaydınız yok.</div>';
            }
        } else {
            listDiv.innerHTML = '<p>Randevular yüklenemedi.</p>';
        }
    } catch (err) {
        console.error('Randevu JS hata:', err);
        listDiv.innerHTML = '<p>Bir hata oluştu.</p>';
    }
}); 