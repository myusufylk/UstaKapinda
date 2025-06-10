class LiveSupport {
    constructor() {
        this.services = [
            { label: 'Randevu alma', value: 'randevu' },
            { label: 'Sunulan servisler', value: 'servis' }
        ];
        this.awaiting = null; // Kullanıcıdan ek bilgi bekleniyor mu?
        this.randevuData = {}; // Çok adımlı randevu için geçici veri
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
        if (value === 'randevu') {
            this.randevuData = {};
            // HİZMETLERİ BUTON OLARAK LİSTELE
            const hizmetler = [
                'Akü Servisi',
                'Yağ Değişimi',
                'Fren Bakımı',
                'Genel Bakım',
                'Elektrik & Elektronik',
                'Kaporta & Boya'
            ];
            let msg = 'Hangi hizmet için randevu almak istersiniz?<br>';
            hizmetler.forEach(hizmet => {
                msg += `<button class='ls-hizmet-btn' data-hizmet='${hizmet}'>${hizmet}</button> `;
            });
            this.addMessage(msg, 'bot');
            setTimeout(() => {
                this.messages.querySelectorAll('.ls-hizmet-btn').forEach(btn => {
                    btn.onclick = () => {
                        this.awaiting = 'randevu_hizmet_btn';
                        this.handleSend(btn.dataset.hizmet);
                    };
                });
            }, 100);
            this.awaiting = 'randevu_hizmet_btn';
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

    handleSend(valParam) {
        const val = (typeof valParam === 'string') ? valParam : this.input.value.trim();
        if (!val) return;
        this.addMessage(val, 'user');
        // Hizmet butonundan gelirse önce dükkanları listele
        if (this.awaiting === 'randevu_hizmet_btn') {
            this.randevuData.hizmet = val;
            fetch(`/api/shops?service=${encodeURIComponent(val)}`)
                .then(res => res.json())
                .then(shops => {
                    if (shops.length > 0) {
                        let msg = 'Aşağıdaki dükkanlardan birini seçebilirsiniz:<br>';
                        shops.forEach(shop => {
                            msg += `<button class='ls-dukkans-btn' data-name='${shop.name}'>${shop.name} - ${shop.address}</button><br>`;
                        });
                        this.addMessage(msg, 'bot');
                        setTimeout(() => {
                            this.messages.querySelectorAll('.ls-dukkans-btn').forEach(btn => {
                                btn.onclick = () => {
                                    this.awaiting = 'randevu_dukkan_btn';
                                    this.handleSend(btn.dataset.name);
                                };
                            });
                        }, 100);
                        this.awaiting = 'randevu_dukkan_btn';
                    } else {
                        this.addMessage('Üzgünüm, bu hizmeti sunan bir dükkan bulunamadı. Lütfen başka bir hizmet seçin.', 'bot');
                        this.awaiting = 'randevu_hizmet_btn';
                    }
                });
        } else if (this.awaiting === 'randevu_dukkan_btn') {
            this.randevuData.dukkan = val;
            setTimeout(() => {
                this.addMessage('Hangi tarih ve saat için randevu almak istersiniz?', 'bot');
                this.awaiting = 'randevu_tarih';
            }, 400);
        } else if (this.awaiting === 'randevu_hizmet') {
            // Elle hizmet yazılırsa da aynı akış
            this.randevuData.hizmet = val;
            fetch(`/api/shops?service=${encodeURIComponent(val)}`)
                .then(res => res.json())
                .then(shops => {
                    if (shops.length > 0) {
                        let msg = 'Aşağıdaki dükkanlardan birini seçebilirsiniz:<br>';
                        shops.forEach(shop => {
                            msg += `<button class='ls-dukkans-btn' data-name='${shop.name}'>${shop.name} - ${shop.address}</button><br>`;
                        });
                        this.addMessage(msg, 'bot');
                        setTimeout(() => {
                            this.messages.querySelectorAll('.ls-dukkans-btn').forEach(btn => {
                                btn.onclick = () => {
                                    this.input.value = btn.dataset.name;
                                    this.awaiting = 'randevu_dukkan_btn';
                                    this.handleSend();
                                };
                            });
                        }, 100);
                        this.awaiting = 'randevu_dukkan_btn';
                    } else {
                        this.addMessage('Üzgünüm, bu hizmeti sunan bir dükkan bulunamadı. Lütfen başka bir hizmet girin.', 'bot');
                        this.awaiting = 'randevu_hizmet';
                    }
                });
        } else if (this.awaiting === 'randevu_tarih') {
            this.randevuData.tarih = val;
            setTimeout(() => {
                this.addMessage(
                    `<b>Randevu Talebiniz Alındı!</b><br>
                    <b>Hizmet:</b> ${this.randevuData.hizmet}<br>
                    <b>Dükkan:</b> ${this.randevuData.dukkan}<br>
                    <b>Tarih:</b> ${this.randevuData.tarih}<br>
                    En kısa sürede onay için sizinle iletişime geçeceğiz.`,
                    'bot'
                );
                this.awaiting = null;
                this.randevuData = {};
            }, 600);
        }
        this.input.value = '';
    }
}

window.LiveSupport = LiveSupport;
document.addEventListener('DOMContentLoaded', () => {
    window.livesupport = new LiveSupport();
}); 