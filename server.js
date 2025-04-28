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
        options: []
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
        options: []
    },
    'motor': {
        response: 'Motor bakım hizmetlerimiz hakkında bilgi almak için lütfen aracınızın marka ve modelini belirtin:',
        options: []
    },
    'fren': {
        response: 'Fren sistemi bakım hizmetlerimiz hakkında bilgi almak için lütfen aracınızın marka ve modelini belirtin:',
        options: []
    },
    'yağ': {
        response: 'Yağ değişim hizmetlerimiz hakkında bilgi almak için lütfen aracınızın marka ve modelini belirtin:',
        options: []
    },
    'lastik': {
        response: 'Lastik hizmetlerimiz hakkında bilgi almak için lütfen aracınızın marka ve modelini belirtin:',
        options: []
    },
    'elektrik': {
        response: 'Elektrik sistemi bakım hizmetlerimiz hakkında bilgi almak için lütfen aracınızın marka ve modelini belirtin:',
        options: []
    },
    'klima': {
        response: 'Klima bakım hizmetlerimiz hakkında bilgi almak için lütfen aracınızın marka ve modelini belirtin:',
        options: []
    },
    'kaporta': {
        response: 'Kaporta ve boya hizmetlerimiz hakkında bilgi almak için lütfen aracınızın marka ve modelini belirtin:',
        options: []
    }
};

// Ana menü seçenekleri
const mainMenuOptions = [
    { text: '1️⃣ Araç servis hizmetlerimiz', value: 'M-1' },
    { text: '2️⃣ Randevu bilgisi almak istiyorum', value: 'M-2' },
    { text: '3️⃣ Servis Merkezi Değerlendirmeleri', value: 'M-3' }
];

// Fiyat hesaplama seçenekleri
const priceCalculationOptions = [
    { text: '1️⃣ Periyodik bakım fiyatı hesapla', value: 'P-1' },
    { text: '2️⃣ Motor bakımı fiyatı hesapla', value: 'P-2' },
    { text: '3️⃣ Fren sistemi bakımı fiyatı hesapla', value: 'P-3' },
    { text: '4️⃣ Yağ değişimi fiyatı hesapla', value: 'P-4' },
    { text: '5️⃣ Lastik değişimi fiyatı hesapla', value: 'P-5' },
    { text: '6️⃣ Elektrik sistemi bakımı fiyatı hesapla', value: 'P-6' },
    { text: '7️⃣ Klima bakımı fiyatı hesapla', value: 'P-7' },
    { text: '8️⃣ Kaporta ve boya fiyatı hesapla', value: 'P-8' },
    { text: '9️⃣ Ana menüye dön', value: 'M-0' }
];

// Fiyat aralıkları
const priceRanges = {
    'P-1': { min: 500, max: 1500, description: 'Periyodik bakım' },
    'P-2': { min: 1000, max: 3000, description: 'Motor bakımı' },
    'P-3': { min: 800, max: 2000, description: 'Fren sistemi bakımı' },
    'P-4': { min: 300, max: 800, description: 'Yağ değişimi' },
    'P-5': { min: 400, max: 1200, description: 'Lastik değişimi' },
    'P-6': { min: 600, max: 1800, description: 'Elektrik sistemi bakımı' },
    'P-7': { min: 400, max: 1000, description: 'Klima bakımı' },
    'P-8': { min: 2000, max: 5000, description: 'Kaporta ve boya' }
};

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

// Araç tipi seçenekleri
const vehicleTypeOptions = [
    { text: '1️⃣ Binek araç', value: 'V-1' },
    { text: '2️⃣ SUV', value: 'V-2' },
    { text: '3️⃣ Ticari araç', value: 'V-3' },
    { text: '4️⃣ Motosiklet', value: 'V-4' },
    { text: '5️⃣ Kamyon', value: 'V-5' },
    { text: '6️⃣ Minibüs', value: 'V-6' }
];

// Araç tipi haritası
const vehicleTypeMap = {
    'V-1': 'binek',
    'V-2': 'suv',
    'V-3': 'ticari',
    'V-4': 'motosiklet',
    'V-5': 'kamyon',
    'V-6': 'minibüs'
};

// Acil durum seçenekleri
const emergencyOptions = [
    { text: '1️⃣ Yolda kaldım', value: 'E-1' },
    { text: '2️⃣ Akü takviyesi', value: 'E-2' },
    { text: '3️⃣ Lastik patladı', value: 'E-3' },
    { text: '4️⃣ Çekici çağır', value: 'E-4' },
    { text: '5️⃣ Ana menüye dön', value: 'M-0' }
];

// Acil durum servisleri
const emergencyServices = {
    'E-1': {
        response: 'Lütfen konumunuzu paylaşın. Size en yakın yardım ekibini yönlendireceğiz.',
        service: 'Yolda kalma yardımı'
    },
    'E-2': {
        response: 'Lütfen konumunuzu paylaşın. Size en yakın akü takviye ekibini yönlendireceğiz.',
        service: 'Akü takviyesi'
    },
    'E-3': {
        response: 'Lütfen konumunuzu paylaşın. Size en yakın lastik değişim ekibini yönlendireceğiz.',
        service: 'Lastik değişimi'
    },
    'E-4': {
        response: 'Lütfen konumunuzu paylaşın. Size en yakın çekici ekibini yönlendireceğiz.',
        service: 'Çekici hizmeti'
    }
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
            { user: 'Cem Y.', rating: 5, comment: 'Tüm bakımlarımı burada yaptırıyorum, çok memnunum.' },
            { user: 'Gizem L.', rating: 5, comment: 'Müşteri hizmetleri çok iyi, her konuda yardımcı oluyorlar.' },
            { user: 'Murat S.', rating: 4, comment: 'Kaliteli hizmet, fakat biraz yoğun olabiliyor.' }
        ]
    }
};

// Socket.io bağlantı olaylarını dinle
io.on('connection', (socket) => {
    console.log('Yeni bir kullanıcı bağlandı');
    
    // Kullanıcı durumunu başlat
    userStates.set(socket.id, { 
        waitingForPhone: false, 
        phoneNumber: null,
        lastService: null,
        waitingForCarInfo: false,
        waitingForVehicleType: false
    });

    // Kullanıcı bağlandığında ana menüyü göster
    setTimeout(() => {
        socket.emit('chat message', { 
            type: 'bot', 
            text: 'Merhaba! UstaKapında Araç Servisi\'ne hoş geldiniz! Size nasıl yardımcı olabilirim?'
        });
        
        setTimeout(() => {
            mainMenuOptions.forEach(option => {
                socket.emit('chat message', { 
                    type: 'bot', 
                    text: option.text,
                    isButton: true,
                    value: option.value
                });
            });
        }, 500);
    }, 1000);

    // Kullanıcı mesaj gönderdiğinde
    socket.on('chat message', (msg) => {
        console.log('Mesaj: ' + msg);
        
        // Sadece teknik olmayan mesajları göster
        if (!msg.match(/^[MSRV]-/)) {
            socket.emit('chat message', { type: 'user', text: msg });
        }

        const lowerMsg = msg.toLowerCase().trim();
        const userState = userStates.get(socket.id) || {};

        // Ana menü seçenekleri
        const mainMenuOptions = [
            { text: '1️⃣ Araç servis hizmetlerimiz', value: 'M-1' },
            { text: '2️⃣ Randevu bilgisi almak istiyorum', value: 'M-2' },
            { text: '3️⃣ Servis Merkezi Değerlendirmeleri', value: 'M-3' }
        ];

        // Hizmet menüsü seçenekleri
        const serviceMenuOptions = [
            { text: '1️⃣ Periyodik bakım', value: 'S-1' },
            { text: '2️⃣ Motor bakımı', value: 'S-2' },
            { text: '3️⃣ Fren sistemi bakımı', value: 'S-3' },
            { text: '4️⃣ Yağ değişimi', value: 'S-4' },
            { text: '5️⃣ Lastik değişimi ve bakımı', value: 'S-5' },
            { text: '6️⃣ Elektrik sistemi bakımı', value: 'S-6' },
            { text: '7️⃣ Klima bakımı', value: 'S-7' },
            { text: '8️⃣ Kaporta ve boya', value: 'S-8' },
            { text: '9️⃣ Ana menüye dön', value: 'M-0' }
        ];

        // Ana menü seçimlerini kontrol et
        const mainMenuMatch = msg.match(/M-(\d+)/);
        if (mainMenuMatch) {
            const [_, number] = mainMenuMatch;
            if (number === '0') {
                socket.emit('chat message', { 
                    type: 'bot', 
                    text: 'Merhaba! UstaKapında Araç Servisi\'ne hoş geldiniz! Size nasıl yardımcı olabilirim?'
                });
                
                setTimeout(() => {
                    mainMenuOptions.forEach(option => {
                        socket.emit('chat message', { 
                            type: 'bot', 
                            text: option.text,
                            isButton: true,
                            value: option.value
                        });
                    });
                }, 500);
                return;
            } else if (number === '1') {
                socket.emit('chat message', { 
                    type: 'user', 
                    text: 'Seçilen menü: 1 - Araç servis hizmetlerimiz'
                });
                
                socket.emit('chat message', { 
                    type: 'bot', 
                    text: 'Hangi araç servis hizmeti hakkında bilgi almak istersiniz?'
                });
                
                setTimeout(() => {
                    serviceMenuOptions.forEach(option => {
                        socket.emit('chat message', { 
                            type: 'bot', 
                            text: option.text,
                            isButton: true,
                            value: option.value
                        });
                    });
                }, 500);
                return;
            } else if (number === '2') {
                socket.emit('chat message', { 
                    type: 'user', 
                    text: 'Seçilen menü: 2 - Randevu bilgisi almak istiyorum'
                });
                
                const userAppointments = appointments[userState.phoneNumber] || [];
                if (userAppointments.length === 0) {
                    socket.emit('chat message', {
                        type: 'bot',
                        text: 'Henüz bir randevunuz bulunmamaktadır.'
                    });
                } else {
                    socket.emit('chat message', {
                        type: 'bot',
                        text: 'Randevu bilgileriniz:'
                    });
                    userAppointments.forEach((appointment, index) => {
                        setTimeout(() => {
                            socket.emit('chat message', {
                                type: 'bot',
                                text: `${index + 1}. Randevu:\nTarih: ${appointment.date}\nSaat: ${appointment.time}\nHizmet: ${appointment.service}\nServis: ${appointment.shop}\nDurum: ${appointment.status}`
                            });
                        }, 500 * (index + 1));
                    });
                }
                setTimeout(() => {
                    socket.emit('chat message', {
                        type: 'bot',
                        text: '🔙 Ana menüye dön',
                        isButton: true,
                        value: 'M-0'
                    });
                }, 500 * (userAppointments.length + 1));
                return;
            } else if (number === '3') {
                socket.emit('chat message', { 
                    type: 'user', 
                    text: 'Seçilen menü: 3 - Servis Merkezi Değerlendirmeleri'
                });
                
                socket.emit('chat message', { 
                    type: 'bot', 
                    text: 'Hangi servis merkezinin değerlendirmelerini görmek istersiniz?'
                });
                
                setTimeout(() => {
                    Object.keys(serviceReviews).forEach((shop, index) => {
                        socket.emit('chat message', { 
                            type: 'bot', 
                            text: `${index + 1}️⃣ ${shop} (⭐ ${serviceReviews[shop].rating})`,
                            isButton: true,
                            value: `R-${index + 1}`
                        });
                    });
                    socket.emit('chat message', { 
                        type: 'bot', 
                        text: '9️⃣ Ana menüye dön',
                        isButton: true,
                        value: 'M-0'
                    });
                }, 500);
                return;
            }
        }

        // Değerlendirme seçimlerini kontrol et
        const reviewMatch = msg.match(/R-(\d+)/);
        if (reviewMatch) {
            const [_, number] = reviewMatch;
            const selectedShop = Object.keys(serviceReviews)[number - 1];
            
            if (selectedShop) {
                const shopReviews = serviceReviews[selectedShop];
                socket.emit('chat message', { 
                    type: 'bot', 
                    text: `📊 ${selectedShop} Değerlendirmeleri\n⭐ Genel Puan: ${shopReviews.rating}\n\nSon Yorumlar:`
                });
                
                shopReviews.reviews.forEach((review, index) => {
                    setTimeout(() => {
                        socket.emit('chat message', { 
                            type: 'bot', 
                            text: `👤 ${review.user}\n⭐ ${review.rating}/5\n💬 ${review.comment}`
                        });
                    }, 500 * (index + 1));
                });
                
                setTimeout(() => {
                    socket.emit('chat message', { 
                        type: 'bot', 
                        text: '🔙 Ana menüye dön',
                        isButton: true,
                        value: 'M-0'
                    });
                }, 500 * (shopReviews.reviews.length + 1));
                return;
            }
        }

        // Hizmet seçimlerini kontrol et
        const serviceMatch = msg.match(/S-(\d+)/);
        if (serviceMatch) {
            const [_, number] = serviceMatch;
            const serviceTypes = ['periyodik', 'motor', 'fren', 'yağ', 'lastik', 'elektrik', 'klima', 'kaporta'];
            const serviceNames = {
                'periyodik': 'Periyodik Bakım',
                'motor': 'Motor Bakımı',
                'fren': 'Fren Sistemi Bakımı',
                'yağ': 'Yağ Değişimi',
                'lastik': 'Lastik Değişimi ve Bakımı',
                'elektrik': 'Elektrik Sistemi Bakımı',
                'klima': 'Klima Bakımı',
                'kaporta': 'Kaporta ve Boya'
            };
            const selectedService = serviceTypes[number - 1];
            
            if (selectedService && autoResponses[selectedService]) {
                socket.emit('chat message', { 
                    type: 'user', 
                    text: `Seçilen hizmet: ${number} - ${serviceNames[selectedService]}`
                });
                
                const response = autoResponses[selectedService];
                socket.emit('chat message', { 
                    type: 'bot', 
                    text: response.response
                });
                
                // Kullanıcı durumunu güncelle
                userStates.set(socket.id, { 
                    ...userState,
                    waitingForCarInfo: true,
                    waitingForVehicleType: false,
                    lastService: selectedService
                });
                return;
            }
        }

        // Marka ve model bilgisi kontrolü
        if (userState.waitingForCarInfo) {
            const serviceType = userState.lastService;
            const serviceNames = {
                'periyodik': 'Periyodik Bakım',
                'motor': 'Motor Bakımı',
                'fren': 'Fren Sistemi Bakımı',
                'yağ': 'Yağ Değişimi',
                'lastik': 'Lastik Değişimi ve Bakımı',
                'elektrik': 'Elektrik Sistemi Bakımı',
                'klima': 'Klima Bakımı',
                'kaporta': 'Kaporta ve Boya'
            };
            
            // Araç tipi seçeneklerini göster
            socket.emit('chat message', {
                type: 'bot',
                text: 'Lütfen aracınızın tipini seçin:'
            });
            
            vehicleTypeOptions.forEach(option => {
                socket.emit('chat message', {
                    type: 'bot',
                    text: option.text,
                    isButton: true,
                    value: option.value
                });
            });

            // Kullanıcı durumunu güncelle
            userStates.set(socket.id, {
                ...userState,
                waitingForCarInfo: false,
                waitingForVehicleType: true,
                lastService: serviceType,
                carInfo: msg
            });
            return;
        }

        // Araç tipi seçimi kontrolü
        if (userState.waitingForVehicleType) {
            const vehicleTypeMatch = msg.match(/V-(\d+)/);
            if (vehicleTypeMatch) {
                const [_, number] = vehicleTypeMatch;
                const vehicleType = vehicleTypeMap[`V-${number}`];
                const vehicleTypeNames = {
                    'binek': 'Binek Araç',
                    'suv': 'SUV',
                    'ticari': 'Ticari Araç',
                    'motosiklet': 'Motosiklet',
                    'kamyon': 'Kamyon',
                    'minibüs': 'Minibüs'
                };
                const serviceType = userState.lastService;
                const serviceNames = {
                    'periyodik': 'Periyodik Bakım',
                    'motor': 'Motor Bakımı',
                    'fren': 'Fren Sistemi Bakımı',
                    'yağ': 'Yağ Değişimi',
                    'lastik': 'Lastik Değişimi ve Bakımı',
                    'elektrik': 'Elektrik Sistemi Bakımı',
                    'klima': 'Klima Bakımı',
                    'kaporta': 'Kaporta ve Boya'
                };
                const carInfo = userState.carInfo;
                const serviceTypes = ['periyodik', 'motor', 'fren', 'yağ', 'lastik', 'elektrik', 'klima', 'kaporta'];
                const serviceIndex = serviceTypes.indexOf(serviceType) + 1;
                const priceRange = priceRanges[`P-${serviceIndex}`];

                socket.emit('chat message', { 
                    type: 'user', 
                    text: `Seçilen araç tipi: ${number} - ${vehicleTypeNames[vehicleType]}`
                });

                socket.emit('chat message', {
                    type: 'bot',
                    text: `Teşekkürler! ${carInfo} (${vehicleTypeNames[vehicleType]}) aracınız için ${serviceNames[serviceType]} hizmetimiz ${priceRange.min} TL ile ${priceRange.max} TL arasında değişmektedir. Size en yakın servis merkezlerimiz:`
                });

                // Uygun servis merkezlerini bul
                const suitableShops = Object.entries(registeredShops)
                    .filter(([_, shop]) => shop.services.includes(serviceType) && shop.vehicleTypes.includes(vehicleType))
                    .map(([name, shop]) => `${name}\n📍 ${shop.address}\n📞 ${shop.phone}\n⭐ ${shop.rating}\n🚗 ${shop.distance}`);

                setTimeout(() => {
                    suitableShops.forEach(shop => {
                        socket.emit('chat message', {
                            type: 'bot',
                            text: shop
                        });
                    });
                }, 500);

                setTimeout(() => {
                    socket.emit('chat message', {
                        type: 'bot',
                        text: '🔙 Ana menüye dön',
                        isButton: true,
                        value: 'M-0'
                    });
                }, 500 * (suitableShops.length + 1));

                // Kullanıcı durumunu sıfırla
                userStates.set(socket.id, {
                    ...userState,
                    waitingForVehicleType: false,
                    lastService: null,
                    carInfo: null
                });
                return;
            }
        }

        // Ana menüye dönüş
        if (lowerMsg.includes('ana menü') || lowerMsg.includes('üst menü') || lowerMsg === '9') {
            const mainResponse = autoResponses['1'];
            // Önce mesajı gönder
            socket.emit('chat message', { 
                type: 'bot', 
                text: mainResponse.response
            });
            
            // Sonra menü seçeneklerini gönder
            setTimeout(() => {
                mainResponse.options.forEach(option => {
                    socket.emit('chat message', { 
                        type: 'bot', 
                        text: option.text,
                        isButton: true,
                        value: option.value
                    });
                });
            }, 500);
            return;
        }

        // Tanınmayan mesajlar için
        if (!userState.waitingForVehicleType && !userState.waitingForCarInfo) {
            socket.emit('chat message', { 
                type: 'bot', 
                text: 'Üzgünüm, sizi anlayamadım. Lütfen menüden bir seçenek seçin.'
            });
            
            // Ana menü seçeneklerini göster
            setTimeout(() => {
                const mainResponse = autoResponses['1'];
                mainResponse.options.forEach(option => {
                    socket.emit('chat message', { 
                        type: 'bot', 
                        text: option.text,
                        isButton: true,
                        value: option.value
                    });
                });
            }, 500);
        }
    });

    // Kullanıcı bağlantısı kesildiğinde
    socket.on('disconnect', () => {
        console.log('Bir kullanıcı ayrıldı');
        userStates.delete(socket.id);
    });
});

// Sunucuyu başlat
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor`);
}); 