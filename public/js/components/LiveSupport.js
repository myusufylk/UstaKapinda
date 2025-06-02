class LiveSupport {
    constructor() {
        this.services = [
            { label: 'Randevu alma', value: 'randevu' },
            { label: 'Fiyat bilgisi', value: 'fiyat' },
            { label: 'Adres ve çalışma saatleri', value: 'adres' },
            { label: 'Sunulan servisler', value: 'servis' }
        ];
        this.awaiting = null; // Kullanıcıdan ek bilgi bekleniyor mu?
        this.initUI();
        this.initEvents();
    }

    initUI() {
        // Önce eski pencereyi kaldır
        const old = document.querySelector('.livesupport-container');
        if (old) old.remove();
        // Ana pencere
        const container = document.createElement('div');
        container.className = 'livesupport-container';
        container.innerHTML = `
            <div class="livesupport-window" style="display:none;">
                <div class="livesupport-header">
                    <span><i class="fas fa-comments"></i> Canlı Destek</span>
                    <button class="close-btn" type="button">×</button>
                </div>
                <div class="livesupport-body">
                    <div class="livesupport-messages"></div>
                    <div class="livesupport-input">
                        <input type="text" placeholder="Mesajınızı yazın...">
                        <button type="button" class="send-btn">Gönder</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(container);
        this.container = container;
        this.window = container.querySelector('.livesupport-window');
        this.messages = container.querySelector('.livesupport-messages');
        this.input = container.querySelector('input');
        this.sendBtn = container.querySelector('.send-btn');
        this.closeBtn = container.querySelector('.close-btn');
        this.emojiBtn = document.querySelector('.livesupport-emoji');
    }

    initEvents() {
        if (this.emojiBtn) {
            this.emojiBtn.addEventListener('click', () => {
                this.window.style.display = 'block';
                this.messages.innerHTML = '';
                this.addMessage('Hoş geldiniz! Ben canlı destek asistanınızım.', 'bot');
                setTimeout(() => {
                    this.addMessage('Size nasıl yardımcı olabilirim?', 'bot');
                    this.addServiceButtons();
                }, 500);
            });
        }
        this.closeBtn.addEventListener('click', () => {
            this.window.style.display = 'none';
        });
        this.sendBtn.addEventListener('click', () => this.handleSend());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSend();
        });
    }

    addServiceButtons() {
        const div = document.createElement('div');
        div.className = 'ls-services';
        this.services.forEach(service => {
            const btn = document.createElement('button');
            btn.className = 'ls-service-btn';
            btn.innerText = service.label;
            btn.onclick = () => {
                this.handleServiceClick(service.value, service.label);
            };
            div.appendChild(btn);
        });
        this.messages.appendChild(div);
        this.messages.scrollTop = this.messages.scrollHeight;
    }

    handleServiceClick(value, label) {
        this.addMessage(label, 'user');
        this.input.value = '';
        // Senaryolu cevaplar
        if (value === 'randevu') {
            this.addMessage('Hangi tarih ve saat için randevu almak istersiniz?', 'bot');
            this.awaiting = 'randevu';
        } else if (value === 'fiyat') {
            this.addMessage('Hangi hizmetin fiyatını öğrenmek istersiniz? (ör: yağ değişimi, fren bakımı...)', 'bot');
            this.awaiting = 'fiyat';
        } else if (value === 'adres') {
            this.addMessage('Adresimiz: Örnek Mah. Servis Sk. No:1, İstanbul<br>Çalışma saatlerimiz: Hafta içi 09:00-18:00, Cumartesi 09:00-14:00', 'bot');
            this.awaiting = null;
        } else if (value === 'servis') {
            this.addMessage('Akü servisi, yağ değişimi, fren bakımı, genel bakım ve daha fazlası. Detaylı bilgi için birini seçebilirsiniz.', 'bot');
            this.awaiting = null;
        }
    }

    addMessage(msg, type) {
        const div = document.createElement('div');
        div.className = 'ls-message ' + type;
        div.innerHTML = msg;
        this.messages.appendChild(div);
        // Bot mesajından sonra geri dön butonu ekle
        if (type === 'bot') {
            const backBtn = document.createElement('button');
            backBtn.className = 'ls-back-btn';
            backBtn.innerText = 'Geri Dön';
            backBtn.onclick = () => {
                this.awaiting = null;
                this.addServiceButtons();
            };
            this.messages.appendChild(backBtn);
        }
        this.messages.scrollTop = this.messages.scrollHeight;
    }

    handleSend() {
        const val = this.input.value.trim();
        if (!val) return;
        this.addMessage(val, 'user');
        // Senaryolu cevaplar
        if (this.awaiting === 'randevu') {
            setTimeout(() => {
                this.addMessage('Randevu talebiniz alındı! En kısa sürede onay için sizinle iletişime geçeceğiz.', 'bot');
                this.awaiting = null;
            }, 600);
        } else if (this.awaiting === 'fiyat') {
            // Basit örnek: yağ değişimi veya fren bakımı
            let cevap = 'Bu hizmetin fiyatı için lütfen detay verin.';
            if (val.toLowerCase().includes('yağ')) cevap = "Yağ değişimi fiyatımız 500 TL'dir.";
            else if (val.toLowerCase().includes('fren')) cevap = "Fren bakımı fiyatımız 700 TL'dir.";
            setTimeout(() => {
                this.addMessage(cevap, 'bot');
                this.awaiting = null;
            }, 600);
        }
        this.input.value = '';
    }
}

window.LiveSupport = LiveSupport;
document.addEventListener('DOMContentLoaded', () => {
    window.livesupport = new LiveSupport();
}); 