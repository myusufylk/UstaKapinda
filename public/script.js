// Chatbot işlevselliği
let isChatOpen = false;
let currentScenario = null;
let selectedService = null;
let selectedShop = null;
let selectedDate = null;
let selectedTime = null;

// Örnek dükkan verileri
const shops = {
    periyodik: [
        { id: 1, name: "Oto Bakım Merkezi", address: "Atatürk Cad. No:123", rating: 4.8, distance: "2.5 km", phone: "0212 555 0001" },
        { id: 2, name: "Hızlı Servis", address: "İstiklal Cad. No:45", rating: 4.5, distance: "3.1 km", phone: "0212 555 0002" },
        { id: 3, name: "Güvenilir Oto", address: "Bağdat Cad. No:78", rating: 4.7, distance: "4.2 km", phone: "0212 555 0003" }
    ],
    motor: [
        { id: 1, name: "Motor Uzmanı", address: "Eskişehir Yolu No:156", rating: 4.9, distance: "1.8 km", phone: "0212 555 0004" },
        { id: 2, name: "Teknik Servis", address: "Ankara Cad. No:89", rating: 4.6, distance: "2.3 km", phone: "0212 555 0005" }
    ],
    kaporta: [
        { id: 1, name: "Kaporta & Boya", address: "Diyarbakır Cad. No:234", rating: 4.7, distance: "3.5 km", phone: "0212 555 0006" },
        { id: 2, name: "Renk Ustası", address: "Samsun Cad. No:67", rating: 4.8, distance: "2.9 km", phone: "0212 555 0007" }
    ],
    lastik: [
        { id: 1, name: "Lastik Dünyası", address: "Konya Cad. No:345", rating: 4.6, distance: "1.5 km", phone: "0212 555 0008" },
        { id: 2, name: "Jant & Lastik", address: "Antalya Cad. No:90", rating: 4.5, distance: "2.7 km", phone: "0212 555 0009" }
    ],
    elektronik: [
        { id: 1, name: "Elektronik Sistemler", address: "Bursa Cad. No:456", rating: 4.8, distance: "3.2 km", phone: "0212 555 0010" },
        { id: 2, name: "Oto Elektronik", address: "İzmir Cad. No:123", rating: 4.7, distance: "2.1 km", phone: "0212 555 0011" }
    ]
};

// Randevu saatleri
const availableHours = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30"
];

// Yardım senaryoları
const scenarios = {
    start: {
        message: "Merhaba! Ben UstaKapında asistanıyım. Size nasıl yardımcı olabilirim?",
        options: [
            { text: "Hizmetler hakkında bilgi almak istiyorum", next: "services" },
            { text: "Şikayet/Öneri bildirmek istiyorum", next: "feedback" }
        ]
    },
    services: {
        message: "Size sunduğumuz araç bakım ve onarım hizmetleri:",
        options: [
            { text: "Periyodik Bakım", next: "service_detail", service: "periyodik" },
            { text: "Motor Tamiri", next: "service_detail", service: "motor" },
            { text: "Kaporta & Boya", next: "service_detail", service: "kaporta" },
            { text: "Lastik & Jant", next: "service_detail", service: "lastik" },
            { text: "Elektronik Sistemler", next: "service_detail", service: "elektronik" },
            { text: "Ana Menüye Dön", next: "start" }
        ]
    },
    service_detail: {
        message: function(service) {
            selectedService = service;
            const details = {
                periyodik: "Periyodik bakım hizmetlerimiz: Yağ değişimi, filtre değişimi, fren kontrolü, sıvı kontrolleri, genel kontrol ve bakım. Tüm marka ve modeller için hizmet.",
                motor: "Motor tamir hizmetlerimiz: Motor arıza tespiti, tamir ve bakım, turbo sistemleri, yakıt sistemi, soğutma sistemi ve egzoz sistemi tamirleri.",
                kaporta: "Kaporta ve boya hizmetlerimiz: Çarpışma tamiri, boya işlemleri, kaporta düzeltme, çizik giderme, korozyon önleme ve koruma işlemleri.",
                lastik: "Lastik ve jant hizmetlerimiz: Lastik değişimi, balans ayarı, rot ayarı, jant tamiri, lastik tamiri ve lastik saklama hizmetleri.",
                elektronik: "Elektronik sistem hizmetlerimiz: OBD arıza tespiti, sensör tamirleri, klima sistemleri, güvenlik sistemleri, navigasyon ve multimedya sistemleri tamiri."
            };
            return details[service] || "Bu hizmet hakkında detaylı bilgi için lütfen bizimle iletişime geçin.";
        },
        options: [
            { text: "Bu hizmet için randevu almak istiyorum", next: "car_info" },
            { text: "Ana Menüye Dön", next: "start" }
        ]
    },
    car_info: {
        message: "Lütfen aracınızın bilgilerini girin:",
        input: true,
        fields: [
            { name: "marka", label: "Araç Markası" },
            { name: "model", label: "Araç Modeli" },
            { name: "yil", label: "Model Yılı" }
        ],
        next: "shop_list"
    },
    shop_list: {
        message: function(carInfo) {
            const serviceShops = shops[selectedService] || [];
            if (serviceShops.length === 0) {
                return "Üzgünüm, bu hizmet için yakınınızda dükkan bulunamadı.";
            }

            let message = `${carInfo.marka} ${carInfo.model} (${carInfo.yil}) aracınız için yakınınızdaki dükkanlar:\n\n`;
            serviceShops.forEach(shop => {
                message += `🏪 ${shop.name}\n`;
                message += `📍 ${shop.address}\n`;
                message += `⭐ ${shop.rating} (${shop.distance})\n`;
                message += `📞 ${shop.phone}\n\n`;
            });
            return message;
        },
        options: [
            { text: "Randevu almak istiyorum", next: "appointment" },
            { text: "Başka dükkanları göster", next: "more_shops" },
            { text: "Ana Menüye Dön", next: "start" }
        ]
    },
    more_shops: {
        message: function() {
            // Şimdilik örnek olarak daha fazla dükkan yoksa bilgilendir
            return "Şu anda listelenenler dışında başka dükkan bulunmamaktadır. Daha fazla seçenek için lütfen daha sonra tekrar deneyin.";
        },
        options: [
            { text: "Ana Menüye Dön", next: "start" }
        ]
    },
    phone_appointment: {
        message: "Telefonla randevu almak için lütfen aşağıdaki numarayı arayın:\n\n☎️ 0212 555 0012\n\nSize yardımcı olmaktan memnuniyet duyarız!",
        options: [
            { text: "Ana Menüye Dön", next: "start" }
        ]
    },
    complaint: {
        message: "Lütfen şikayetinizi aşağıya yazınız:",
        input: true,
        fields: [
            { name: "complaintText", label: "Şikayetiniz" }
        ],
        next: "complaint_thanks"
    },
    complaint_thanks: {
        message: "Şikayetiniz alınmıştır. Geri bildiriminiz için teşekkür ederiz!",
        options: [
            { text: "Ana Menüye Dön", next: "start" }
        ]
    },
    suggestion: {
        message: "Lütfen önerinizi aşağıya yazınız:",
        input: true,
        fields: [
            { name: "suggestionText", label: "Öneriniz" }
        ],
        next: "suggestion_thanks"
    },
    suggestion_thanks: {
        message: "Öneriniz alınmıştır. Geri bildiriminiz için teşekkür ederiz!",
        options: [
            { text: "Ana Menüye Dön", next: "start" }
        ]
    },
    appointment: {
        message: "Randevu almak için lütfen aşağıdaki seçeneklerden birini seçin:",
        options: [
            { text: "Online randevu oluştur", next: "select_shop" },
            { text: "Telefonla randevu al", next: "phone_appointment" },
            { text: "Ana Menüye Dön", next: "start" }
        ]
    },
    select_shop: {
        message: "Lütfen randevu almak istediğiniz dükkânı seçin:",
        options: function() {
            const serviceShops = shops[selectedService] || [];
            return serviceShops.map(shop => ({
                text: `${shop.name} (${shop.distance})`,
                next: "select_date",
                shop: shop
            }));
        }
    },
    select_date: {
        message: "Lütfen randevu tarihini seçin:",
        input: true,
        type: "date",
        next: "select_time"
    },
    select_time: {
        message: "Lütfen randevu saatini seçin:",
        input: true,
        type: "time",
        options: function() {
            return availableHours.map(hour => ({
                text: hour,
                next: "confirm_appointment"
            }));
        }
    },
    confirm_appointment: {
        message: function(data) {
            return `Randevu bilgileriniz:\n\n` +
                   `🏪 Dükkan: ${selectedShop.name}\n` +
                   `📍 Adres: ${selectedShop.address}\n` +
                   `📅 Tarih: ${selectedDate}\n` +
                   `⏰ Saat: ${selectedTime}\n\n` +
                   `Randevunuzu onaylıyor musunuz?`;
        },
        options: [
            { text: "Evet, onaylıyorum", next: "appointment_confirmed" },
            { text: "Hayır, iptal et", next: "start" }
        ]
    },
    appointment_confirmed: {
        message: "Randevunuz başarıyla oluşturuldu! Randevu detayları e-posta adresinize gönderilecektir. Başka bir konuda yardımcı olabilir miyim?",
        options: [
            { text: "Ana Menüye Dön", next: "start" }
        ]
    },
    feedback: {
        message: "Lütfen geri bildiriminizi seçin:",
        options: [
            { text: "Şikayet bildir", next: "complaint" },
            { text: "Öneri bildir", next: "suggestion" },
            { text: "Ana Menüye Dön", next: "start" }
        ]
    }
};

// Sayfa yüklendiğinde çalışacak fonksiyon
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sayfa yüklendi, chatbot başlatılıyor...');
    
    // Chatbot penceresini başlangıçta gizle
    const chatbotWindow = document.querySelector('.chatbot-window');
    if (chatbotWindow) {
        chatbotWindow.style.display = 'none';
    }

    // Emoji butonuna tıklama olayı ekle
    const emojiButton = document.querySelector('.chatbot-emoji');
    if (emojiButton) {
        emojiButton.addEventListener('click', toggleChat);
        console.log('Emoji butonu tıklama olayı eklendi');
    }

    // Kapatma butonuna tıklama olayı ekle
    const closeButton = document.querySelector('.close-btn');
    if (closeButton) {
        closeButton.addEventListener('click', toggleChat);
        console.log('Kapatma butonu tıklama olayı eklendi');
    }

    // Enter tuşu ile mesaj gönderme
    const messageInput = document.querySelector('.chat-input input');
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        console.log('Enter tuşu olayı eklendi');
    }

    // Takvim input'u için minimum tarih ayarla
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    // Takvim input'larını güncelle
    document.querySelectorAll('input[type="date"]').forEach(input => {
        input.min = minDate;
    });

    // Başlangıç senaryosunu göster
    showScenario('start');
});

function toggleChat() {
    console.log('toggleChat çağrıldı');
    const chatbotWindow = document.querySelector('.chatbot-window');
    
    if (chatbotWindow) {
        isChatOpen = !isChatOpen;
        chatbotWindow.style.display = isChatOpen ? 'block' : 'none';
        console.log('Chatbot durumu:', isChatOpen ? 'açık' : 'kapalı');
        
        if (isChatOpen) {
            showScenario('start');
        }
    } else {
        console.error('Chatbot penceresi bulunamadı!');
    }
}

function showScenario(scenarioName, data = null) {
    const scenario = scenarios[scenarioName];
    if (!scenario) return;

    currentScenario = scenarioName;
    
    // Mesajı göster
    const message = typeof scenario.message === 'function' ? scenario.message(data) : scenario.message;
    addMessage(message, 'bot');

    // Input alanı varsa göster
    if (scenario.input) {
        if (scenario.type === 'date') {
            showDatePicker(scenario);
        } else if (scenario.type === 'time') {
            showTimePicker(scenario);
        } else {
            showInputFields(scenario.fields);
        }
    } else {
        // Seçenekleri göster
        if (scenario.options) {
            const options = typeof scenario.options === 'function' ? scenario.options() : scenario.options;
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'chat-options';
            
            options.forEach(option => {
                const button = document.createElement('button');
                button.className = 'option-button';
                button.textContent = option.text;
                button.onclick = () => handleOptionClick(option);
                optionsDiv.appendChild(button);
            });

            const messagesDiv = document.querySelector('.chat-messages');
            messagesDiv.appendChild(optionsDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
    }
}

function showInputFields(fields) {
    const inputDiv = document.createElement('div');
    inputDiv.className = 'input-fields';
    
    fields.forEach(field => {
        const label = document.createElement('label');
        label.textContent = field.label;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.name = field.name;
        input.placeholder = field.label;
        
        inputDiv.appendChild(label);
        inputDiv.appendChild(input);
    });

    const submitButton = document.createElement('button');
    submitButton.textContent = 'Gönder';
    submitButton.onclick = () => handleInputSubmit(fields);
    inputDiv.appendChild(submitButton);

    const messagesDiv = document.querySelector('.chat-messages');
    messagesDiv.appendChild(inputDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function handleInputSubmit(fields) {
    const inputs = document.querySelectorAll('.input-fields input');
    const values = {};
    
    inputs.forEach(input => {
        values[input.name] = input.value;
    });

    // Kullanıcının girdiği bilgileri göster
    let message = 'Araç Bilgileri:\n';
    fields.forEach(field => {
        message += `${field.label}: ${values[field.name]}\n`;
    });
    addMessage(message, 'user');

    // Input alanlarını temizle
    const inputDiv = document.querySelector('.input-fields');
    if (inputDiv) {
        inputDiv.remove();
    }

    // Bir sonraki senaryoya geç
    const scenario = scenarios[currentScenario];
    if (scenario.next) {
        showScenario(scenario.next, values);
    }
}

function showDatePicker(scenario) {
    const inputDiv = document.createElement('div');
    inputDiv.className = 'input-fields';
    
    const input = document.createElement('input');
    input.type = 'date';
    input.name = 'date';
    input.min = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0];
    
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Seç';
    submitButton.onclick = () => handleDateSelect(input.value, scenario);
    
    inputDiv.appendChild(input);
    inputDiv.appendChild(submitButton);

    const messagesDiv = document.querySelector('.chat-messages');
    messagesDiv.appendChild(inputDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function showTimePicker(scenario) {
    const inputDiv = document.createElement('div');
    inputDiv.className = 'time-slots';
    
    availableHours.forEach(hour => {
        const button = document.createElement('button');
        button.className = 'time-slot';
        button.textContent = hour;
        button.onclick = () => handleTimeSelect(hour, scenario);
        inputDiv.appendChild(button);
    });

    const messagesDiv = document.querySelector('.chat-messages');
    messagesDiv.appendChild(inputDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function handleDateSelect(date, scenario) {
    selectedDate = date;
    const inputDiv = document.querySelector('.input-fields');
    if (inputDiv) {
        inputDiv.remove();
    }
    if (scenario.next) {
        showScenario(scenario.next);
    }
}

function handleTimeSelect(time, scenario) {
    selectedTime = time;
    const timeSlots = document.querySelector('.time-slots');
    if (timeSlots) {
        timeSlots.remove();
    }
    if (scenario.next) {
        showScenario(scenario.next);
    }
}

function handleOptionClick(option) {
    // Seçilen seçeneği kullanıcı mesajı olarak göster
    addMessage(option.text, 'user');
    
    // Hizmet seçimi
    if (option.service) {
        selectedService = option.service;
    }
    // Dükkan seçimi
    if (option.shop) {
        selectedShop = option.shop;
    }
    
    // Bir sonraki senaryoya geç
    if (option.next) {
        showScenario(option.next);
    }
}

function sendMessage() {
    const input = document.querySelector('.chat-input input');
    const message = input.value.trim();
    
    if (message) {
        addMessage(message, 'user');
        input.value = '';
        
        // Kullanıcı mesajına göre yanıt ver
        setTimeout(() => {
            const response = generateResponse(message);
            addMessage(response, 'bot');
        }, 1000);
    }
}

function addMessage(text, sender) {
    const messagesDiv = document.querySelector('.chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.textContent = text;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function generateResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('merhaba') || lowerMessage.includes('selam')) {
        return 'Merhaba! Size nasıl yardımcı olabilirim?';
    } else if (lowerMessage.includes('teşekkür')) {
        return 'Rica ederim! Başka bir sorunuz var mı?';
    } else {
        return 'Üzgünüm, bu konuda size yardımcı olamıyorum. Lütfen menüden bir seçenek seçin.';
    }
} 