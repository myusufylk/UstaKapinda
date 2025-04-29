const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Statik dosyaları sunmak için
app.use(express.static('public'));

// Kayıtlı kullanıcılar (gerçek uygulamada bu veritabanından gelecek)
const registeredUsers = {
    '05551234567': true,
    '05559876543': true
};

// Kullanıcı durumlarını takip etmek için
const userStates = new Map();

// Otomatik cevaplar için anahtar kelimeler ve cevaplar
const autoResponses = {
    'merhaba': {
        response: 'Merhaba! UstaKapında Araç Servisi\'ne hoş geldiniz! Size nasıl yardımcı olabilirim?',
        options: [
            { text: '1️⃣ Araç servis hizmetlerimiz', value: '1' },
            { text: '2️⃣ Randevu bilgisi almak istiyorum', value: '2' },
            { text: '3️⃣ Servis Merkezi Değerlendirmeleri', value: '3' }
        ]
    },
    '1': {
        response: 'Hangi araç servis hizmeti hakkında bilgi almak istersiniz?',
        options: [
            { text: '1️⃣ Periyodik bakım', value: 'periyodik' },
            { text: '2️⃣ Motor bakımı', value: 'motor' },
            { text: '3️⃣ Fren sistemi bakımı', value: 'fren' },
            { text: '4️⃣ Yağ değişimi', value: 'yağ' },
            { text: '5️⃣ Lastik değişimi ve bakımı', value: 'lastik' },
            { text: '6️⃣ Elektrik sistemi bakımı', value: 'elektrik' },
            { text: '7️⃣ Klima bakımı', value: 'klima' },
            { text: '8️⃣ Kaporta ve boya', value: 'kaporta' },
            { text: '9️⃣ Ana menüye dön', value: 'ana menu' }
        ]
    },
    'periyodik': {
        response: 'Periyodik bakım hizmetlerimiz hakkında bilgi almak için lütfen aracınızın marka ve modelini belirtin:',
        nextState: 'waiting_for_car_info'
    },
    'motor': {
        response: 'Motor bakımı hizmetlerimiz hakkında bilgi almak için lütfen aracınızın marka ve modelini belirtin:',
        nextState: 'waiting_for_car_info'
    },
    'fren': {
        response: 'Fren sistemi bakım hizmetlerimiz hakkında bilgi almak için lütfen aracınızın marka ve modelini belirtin:',
        nextState: 'waiting_for_car_info'
    },
    'yağ': {
        response: 'Yağ değişim hizmetlerimiz hakkında bilgi almak için lütfen aracınızın marka ve modelini belirtin:',
        nextState: 'waiting_for_car_info'
    },
    'lastik': {
        response: 'Lastik hizmetlerimiz hakkında bilgi almak için lütfen aracınızın marka ve modelini belirtin:',
        nextState: 'waiting_for_car_info'
    },
    'elektrik': {
        response: 'Elektrik sistemi bakım hizmetlerimiz hakkında bilgi almak için lütfen aracınızın marka ve modelini belirtin:',
        nextState: 'waiting_for_car_info'
    },
    'klima': {
        response: 'Klima bakım hizmetlerimiz hakkında bilgi almak için lütfen aracınızın marka ve modelini belirtin:',
        nextState: 'waiting_for_car_info'
    },
    'kaporta': {
        response: 'Kaporta ve boya hizmetlerimiz hakkında bilgi almak için lütfen aracınızın marka ve modelini belirtin:',
        nextState: 'waiting_for_car_info'
    },
    '2': {
        response: 'Randevu bilgisi almak için telefon numaranızı giriniz:',
        nextState: 'waiting_for_phone'
    },
    '3': {
        response: 'Hangi servis merkezinin değerlendirmelerini görmek istersiniz?',
        options: [
            { text: '1️⃣ Oto Servis Merkezi', value: 'Oto Servis Merkezi' },
            { text: '2️⃣ Kaporta ve Boya', value: 'Kaporta ve Boya' },
            { text: '3️⃣ Lastik Servisi', value: 'Lastik Servisi' },
            { text: '4️⃣ Tam Servis', value: 'Tam Servis' },
            { text: '5️⃣ Ana menüye dön', value: 'ana menu' }
        ]
    },
    'ana menu': {
        response: 'Size nasıl yardımcı olabilirim?',
        options: [
            { text: '1️⃣ Araç servis hizmetlerimiz', value: '1' },
            { text: '2️⃣ Randevu bilgisi almak istiyorum', value: '2' },
            { text: '3️⃣ Servis Merkezi Değerlendirmeleri', value: '3' }
        ]
    }
};

// Fiyat aralıkları
const priceRanges = {
    'periyodik': { min: 500, max: 1500, description: 'Periyodik bakım' },
    'motor': { min: 1000, max: 3000, description: 'Motor bakımı' },
    'fren': { min: 800, max: 2000, description: 'Fren sistemi bakımı' },
    'yağ': { min: 300, max: 800, description: 'Yağ değişimi' },
    'lastik': { min: 400, max: 1200, description: 'Lastik değişimi' },
    'elektrik': { min: 600, max: 1800, description: 'Elektrik sistemi bakımı' },
    'klima': { min: 400, max: 1000, description: 'Klima bakımı' },
    'kaporta': { min: 2000, max: 5000, description: 'Kaporta ve boya' }
};

// Araç tipi seçenekleri
const vehicleTypeOptions = [
    { text: '1️⃣ Binek araç', value: 'binek' },
    { text: '2️⃣ SUV', value: 'suv' },
    { text: '3️⃣ Ticari araç', value: 'ticari' },
    { text: '4️⃣ Motosiklet', value: 'motosiklet' },
    { text: '5️⃣ Kamyon', value: 'kamyon' },
    { text: '6️⃣ Minibüs', value: 'minibüs' }
];

// Kayıtlı dükkanlar ve hizmetleri
const registeredShops = {
    'Oto Servis Merkezi': {
        services: ['periyodik', 'motor', 'fren', 'yağ', 'elektrik', 'klima'],
        address: 'Atatürk Caddesi No:123',
        phone: '0850 123 45 67',
        rating: '⭐ 4.8',
        distance: '1.2 km',
        vehicleTypes: ['binek', 'suv', 'ticari', 'motosiklet', 'kamyon', 'minibüs']
    },
    'Kaporta ve Boya': {
        services: ['kaporta'],
        address: 'Cumhuriyet Caddesi No:45',
        phone: '0850 234 56 78',
        rating: '⭐ 4.6',
        distance: '2.5 km',
        vehicleTypes: ['binek', 'suv', 'ticari', 'motosiklet', 'kamyon', 'minibüs']
    },
    'Lastik Servisi': {
        services: ['lastik'],
        address: 'İnönü Caddesi No:78',
        phone: '0850 345 67 89',
        rating: '⭐ 4.7',
        distance: '3.1 km',
        vehicleTypes: ['binek', 'suv', 'ticari', 'motosiklet', 'kamyon', 'minibüs']
    },
    'Tam Servis': {
        services: ['periyodik', 'motor', 'fren', 'yağ', 'elektrik', 'klima', 'kaporta', 'lastik'],
        address: 'Fatih Caddesi No:90',
        phone: '0850 456 78 90',
        rating: '⭐ 4.9',
        distance: '4.2 km',
        vehicleTypes: ['binek', 'suv', 'ticari', 'motosiklet', 'kamyon', 'minibüs']
    }
};

// Örnek randevu verileri
const appointments = {
    '05551234567': [
        {
            date: '2024-03-15',
            time: '14:30',
            service: 'Periyodik bakım',
            shop: 'Oto Servis Merkezi',
            status: 'Onaylandı'
        },
        {
            date: '2024-04-01',
            time: '10:00',
            service: 'Lastik değişimi',
            shop: 'Lastik Servisi',
            status: 'Beklemede'
        }
    ],
    '05559876543': [
        {
            date: '2024-03-20',
            time: '11:00',
            service: 'Motor bakımı',
            shop: 'Tam Servis',
            status: 'Onaylandı'
        }
    ]
};

// Servis merkezi değerlendirmeleri
const serviceReviews = {
    'Oto Servis Merkezi': {
        rating: 4.8,
        reviews: [
            { user: 'Ahmet Y.', rating: 5, comment: 'Çok profesyonel ve hızlı hizmet. Kesinlikle tavsiye ederim.' },
            { user: 'Mehmet K.', rating: 4, comment: 'Fiyatlar makul, personel ilgili.' },
            { user: 'Ayşe S.', rating: 5, comment: 'Aracımı güvenle teslim ettim, sonuçtan memnunum.' }
        ]
    },
    'Kaporta ve Boya': {
        rating: 4.6,
        reviews: [
            { user: 'Ali V.', rating: 5, comment: 'Boyama işlemi mükemmel, renk tonu tam istediğim gibi.' },
            { user: 'Zeynep M.', rating: 4, comment: 'İşçilik kaliteli, fakat biraz pahalı.' },
            { user: 'Can B.', rating: 5, comment: 'Çok titiz çalışıyorlar, detaylara önem veriyorlar.' }
        ]
    },
    'Lastik Servisi': {
        rating: 4.7,
        reviews: [
            { user: 'Deniz A.', rating: 5, comment: 'Hızlı ve uygun fiyatlı hizmet.' },
            { user: 'Burak T.', rating: 4, comment: 'Lastik değişimi profesyonelce yapıldı.' },
            { user: 'Selin K.', rating: 5, comment: 'Personel çok bilgili ve yardımsever.' }
        ]
    },
    'Tam Servis': {
        rating: 4.9,
        reviews: [
            { user: 'Cem Y.', rating: 5, comment: 'Tüm bakımlarımı burada yaptırıyorum, çok memnunum.' }
        ]
    }
};

// Socket.io bağlantı yönetimi
io.on('connection', (socket) => {
    console.log('Yeni bir kullanıcı bağlandı');
    userStates.set(socket.id, { state: 'initial', data: {} });

    socket.on('chat message', (message) => {
        const userState = userStates.get(socket.id);
        let response = {};

        if (userState.state === 'waiting_for_phone') {
            // Telefon numarası kontrolü
            if (/^[0-9]{10,11}$/.test(message)) {
                const userAppointments = appointments[message] || [];
                if (userAppointments.length === 0) {
                    response = {
                        response: 'Henüz bir randevunuz bulunmamaktadır.',
                        options: [
                            { text: '1️⃣ Ana menüye dön', value: 'ana menu' }
                        ]
                    };
                } else {
                    const appointmentsText = userAppointments.map((app, index) => 
                        `${index + 1}. Randevu:\nTarih: ${app.date}\nSaat: ${app.time}\nHizmet: ${app.service}\nServis: ${app.shop}\nDurum: ${app.status}`
                    ).join('\n\n');
                    
                    response = {
                        response: `Randevu bilgileriniz:\n\n${appointmentsText}`,
                        options: [
                            { text: '1️⃣ Ana menüye dön', value: 'ana menu' }
                        ]
                    };
                }
                userStates.set(socket.id, { state: 'initial', data: {} });
            } else {
                response = {
                    response: 'Lütfen geçerli bir telefon numarası giriniz (10-11 haneli)',
                    options: []
                };
            }
        } else if (userState.state === 'waiting_for_car_info') {
            // Araç bilgisi alındı, araç tipi seçeneklerini göster
            response = {
                response: 'Lütfen aracınızın tipini seçin:',
                options: vehicleTypeOptions
            };
            userStates.set(socket.id, { 
                state: 'waiting_for_vehicle_type', 
                data: { ...userState.data, carInfo: message } 
            });
        } else if (userState.state === 'waiting_for_vehicle_type') {
            // Araç tipi seçildi, fiyat ve servis merkezi bilgilerini göster
            const serviceType = userState.data.lastService;
            const priceRange = priceRanges[serviceType];
            const vehicleType = message;
            const carInfo = userState.data.carInfo;

            // Uygun servis merkezlerini bul
            const suitableShops = Object.entries(registeredShops)
                .filter(([_, shop]) => shop.services.includes(serviceType) && shop.vehicleTypes.includes(vehicleType));

            // İlk mesaj: Fiyat bilgisi
            socket.emit('chat message', {
                response: `Teşekkürler! ${carInfo} (${vehicleType}) aracınız için ${priceRange.description} hizmetimiz ${priceRange.min} TL ile ${priceRange.max} TL arasında değişmektedir.`,
                options: []
            });

            // İkinci mesaj: Servis merkezleri başlığı
            socket.emit('chat message', {
                response: 'Size en yakın servis merkezlerimiz:',
                options: []
            });

            // Her servis merkezi için ayrı mesaj
            suitableShops.forEach(([name, shop], index) => {
                setTimeout(() => {
                    socket.emit('chat message', {
                        response: `${name}\n📍 ${shop.address}\n📞 ${shop.phone}\n⭐ ${shop.rating}\n🚗 ${shop.distance}`,
                        options: index === suitableShops.length - 1 ? [
                            { text: '1️⃣ Ana menüye dön', value: 'ana menu' }
                        ] : []
                    });
                }, index * 1000); // Her mesaj arasında 1 saniye bekle
            });

            userStates.set(socket.id, { state: 'initial', data: {} });
        } else {
            // Normal mesaj işleme
            if (autoResponses[message]) {
                response = autoResponses[message];
                if (response.nextState) {
                    userStates.set(socket.id, { 
                        state: response.nextState, 
                        data: { ...userState.data, lastService: message } 
                    });
                }
            } else if (serviceReviews[message]) {
                const reviews = serviceReviews[message];
                
                // İlk mesaj: Servis merkezi adı ve genel puanı
                socket.emit('chat message', {
                    response: `${message} - Genel Değerlendirme: ${reviews.rating}⭐`,
                    options: []
                });

                // Her değerlendirme için ayrı mesaj
                reviews.reviews.forEach((review, index) => {
                    setTimeout(() => {
                        socket.emit('chat message', {
                            response: `${review.user} (${review.rating}⭐):\n${review.comment}`,
                            options: index === reviews.reviews.length - 1 ? [
                                { text: '1️⃣ Ana menüye dön', value: 'ana menu' }
                            ] : []
                        });
                    }, (index + 1) * 1000); // Her mesaj arasında 1 saniye bekle
                });
            } else {
                response = {
                    response: 'Üzgünüm, anlayamadım. Lütfen menüden bir seçenek seçin.',
                    options: autoResponses['ana menu'].options
                };
            }
        }

        socket.emit('chat message', response);
    });

    socket.on('disconnect', () => {
        console.log('Bir kullanıcı ayrıldı');
        userStates.delete(socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor`);
}); 