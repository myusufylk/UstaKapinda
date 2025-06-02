// Ana sayfa için ek JS kodu gerekirse buraya eklenebilir.
// Şu an için ekstra bir işlev yok.

// Tüm event listener'ları tek bir DOMContentLoaded içinde toplayalım
window.addEventListener('DOMContentLoaded', function() {
    // Chatbot Widget
    const chatbotContainer = document.querySelector('.chatbot-container');
    const chatbotEmoji = document.querySelector('.chatbot-emoji');
    const chatbotWindow = document.querySelector('.chatbot-window');
    const closeChatbotBtn = document.querySelector('.close-btn');
    const chatMessages = document.querySelector('.chat-messages');
    const chatInput = document.querySelector('.chat-input input');
    const sendChatMessage = document.getElementById('sendChatMessage');

    if (chatbotEmoji && chatbotWindow) {
        chatbotEmoji.addEventListener('click', () => {
            chatbotWindow.style.display = 'block';
        });
    }

    if (closeChatbotBtn) {
        closeChatbotBtn.addEventListener('click', () => {
            chatbotWindow.style.display = 'none';
        });
    }

    if (sendChatMessage && chatInput) {
        sendChatMessage.addEventListener('click', () => {
            const message = chatInput.value.trim();
            if (message) {
                // Kullanıcı mesajını ekle
                const userMessage = document.createElement('div');
                userMessage.className = 'message user';
                userMessage.textContent = message;
                chatMessages.appendChild(userMessage);

                // Chatbot yanıtını simüle et
                setTimeout(() => {
                    const botMessage = document.createElement('div');
                    botMessage.className = 'message bot';
                    botMessage.textContent = 'Üzgünüm, şu anda canlı destek temsilcimiz müsait değil. Lütfen daha sonra tekrar deneyin.';
                    chatMessages.appendChild(botMessage);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }, 1000);

                chatInput.value = '';
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        });

        // Enter tuşu ile mesaj gönderme
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendChatMessage.click();
            }
        });
    }

    // Mesajlaşma Modalı
    const messagesModal = document.getElementById('messagesModal');
    const closeMessagesModal = document.getElementById('closeMessagesModal');

    if (closeMessagesModal && messagesModal) {
        closeMessagesModal.addEventListener('click', () => {
            messagesModal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === messagesModal) {
                messagesModal.style.display = 'none';
            }
        });
    }

    // Kullanıcı menüsü
    const userMenu = document.querySelector('.user-menu');
    const userMenuBtn = document.querySelector('.user-menu-btn');

    if (userMenu && userMenuBtn) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userMenu.classList.toggle('open');
        });

        window.addEventListener('click', (e) => {
            if (!userMenu.contains(e.target)) {
                userMenu.classList.remove('open');
            }
        });
    }

    // Kayıt ve Giriş Modalları
    const registerModal = document.getElementById('registerModal');
    const loginModal = document.getElementById('loginModal');
    const openRegister = document.getElementById('openRegister');
    const openLogin = document.getElementById('openLogin');
    const closeRegisterModal = document.getElementById('closeRegisterModal');
    const closeLoginModal = document.getElementById('closeLoginModal');
    const typeBtns = document.querySelectorAll('.register-type-btn');
    const shopOnlyFields = document.querySelectorAll('.shop-only');

    if (openRegister && registerModal) {
        openRegister.addEventListener('click', (e) => {
            e.preventDefault();
            registerModal.style.display = 'block';
            if (userMenu) userMenu.classList.remove('open');
        });
    }

    if (openLogin && loginModal) {
        openLogin.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.style.display = 'block';
            if (userMenu) userMenu.classList.remove('open');
        });
    }

    if (closeRegisterModal && registerModal) {
        closeRegisterModal.addEventListener('click', () => {
            registerModal.style.display = 'none';
        });
    }

    if (closeLoginModal && loginModal) {
        closeLoginModal.addEventListener('click', () => {
            loginModal.style.display = 'none';
        });
    }

    // Modal dışına tıklama
    window.addEventListener('click', (e) => {
        if (e.target === registerModal) {
            registerModal.style.display = 'none';
        }
        if (e.target === loginModal) {
            loginModal.style.display = 'none';
        }
    });

    // Kullanıcı/Dükkan seçimi
    typeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            typeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (btn.dataset.type === 'shop') {
                shopOnlyFields.forEach(el => el.style.display = 'flex');
            } else {
                shopOnlyFields.forEach(el => el.style.display = 'none');
            }
        });
    });

    // Form submit örneği
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(registerForm);
            const userData = {
                email: formData.get('email'),
                password: formData.get('password'),
                name: formData.get('name'),
                phone: formData.get('phone'),
                type: document.querySelector('.register-type-btn.active').dataset.type,
                address: formData.get('address'),
                services: Array.from(formData.getAll('services'))
            };

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Kayıt başarılı! Giriş yapabilirsiniz.');
                    registerModal.style.display = 'none';
                    registerForm.reset();
                    typeBtns[0].classList.add('active');
                    typeBtns[1].classList.remove('active');
                    shopOnlyFields.forEach(el => el.style.display = 'none');
                } else {
                    alert(data.message || 'Kayıt sırasında bir hata oluştu');
                }
            } catch (error) {
                console.error('Kayıt hatası:', error);
                alert('Bir hata oluştu. Lütfen tekrar deneyin.');
            }
        });
    }

    // Login form submit örneği
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(loginForm);
            const loginData = {
                email: formData.get('email'),
                password: formData.get('password'),
                type: document.querySelector('.login-type-btn.active').dataset.type
            };

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(loginData)
                });

                const data = await response.json();

                if (response.ok) {
                    // Token'ı localStorage'a kaydet
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('userType', data.userType);
                    localStorage.setItem('userId', data.userId);

                    // Kullanıcı menüsünü güncelle
                    updateUserMenu(data.userType, data.name);

                    alert('Giriş başarılı!');
                    loginModal.style.display = 'none';
                    loginForm.reset();
                    loginTypeBtns[0].classList.add('active');
                    loginTypeBtns[1].classList.remove('active');
                } else {
                    alert(data.message || 'Giriş sırasında bir hata oluştu');
                }
            } catch (error) {
                console.error('Giriş hatası:', error);
                alert('Bir hata oluştu. Lütfen tekrar deneyin.');
            }
        });
    }

    // Randevu butonu
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', () => {
            const token = localStorage.getItem('token');
            if (token) {
                // Kullanıcı giriş yapmışsa randevu modalını aç
                alert('Randevu sistemi yakında aktif olacak!');
            } else {
                // Kullanıcı giriş yapmamışsa giriş modalını aç
                loginModal.style.display = 'block';
            }
        });
    }

    // Kullanıcı menüsünü güncelleme fonksiyonu
    function updateUserMenu(userType, userName) {
        const userMenu = document.querySelector('.user-menu');
        if (userMenu) {
            const userDropdown = userMenu.querySelector('.user-dropdown');
            userDropdown.innerHTML = `
                <span class="user-name">${userName}</span>
                <a href="#" id="openAccount">Hesabım</a>
                <a href="#" id="openMessages">Mesajlarım</a>
                ${userType === 'shop' ? '<a href="#" id="openAppointments">Randevularım</a>' : ''}
                <a href="#" id="logout">Çıkış Yap</a>
            `;

            // Çıkış yapma işlemi
            const logoutBtn = document.getElementById('logout');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    localStorage.removeItem('token');
                    localStorage.removeItem('userType');
                    localStorage.removeItem('userId');
                    window.location.reload();
                });
            }
        }
    }

    // Sayfa yüklendiğinde token kontrolü
    async function checkAuth() {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await fetch('/api/auth/verify', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    updateUserMenu(data.userType, data.name);
                } else {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userType');
                    localStorage.removeItem('userId');
                }
            } catch (error) {
                console.error('Token doğrulama hatası:', error);
            }
        }
    }

    // Sayfa yüklendiğinde auth kontrolü yap
    checkAuth();

    // LEAFLET HARİTA ENTEGRASYONU
    window.onload = async function() {
        if (document.getElementById('leafletMap')) {
            // Haritayı başlat (örnek: İstanbul merkezli)
            const map = L.map('leafletMap').setView([41.0082, 28.9784], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(map);
            const markers = L.markerClusterGroup();
            map.addLayer(markers);

            try {
                // Dükkanları API'den çek
                const response = await fetch('/api/craftsmen');
                const shops = await response.json();

                const iconTypes = {
                    genel: L.icon({iconUrl: 'https://cdn-icons-png.flaticon.com/512/484/484167.png', iconSize: [32, 32]}),
                    lastik: L.icon({iconUrl: 'https://cdn-icons-png.flaticon.com/512/3659/3659898.png', iconSize: [32, 32]}),
                    kaporta: L.icon({iconUrl: 'https://cdn-icons-png.flaticon.com/512/2936/2936886.png', iconSize: [32, 32]}),
                    elektrik: L.icon({iconUrl: 'https://cdn-icons-png.flaticon.com/512/3659/3659899.png', iconSize: [32, 32]})
                };

                shops.forEach(shop => {
                    const marker = L.marker([shop.location.coordinates[1], shop.location.coordinates[0]], {
                        icon: iconTypes[shop.type] || iconTypes.genel
                    }).bindPopup(`
                        <b>${shop.name}</b><br>
                        Tür: ${shop.type}<br>
                        Tel: ${shop.phone}<br>
                        <button onclick=\"window.navigateToShop('${shop._id}')\">Yol Tarifi Al</button>
                    `);
                    markers.addLayer(marker);
                });

                // Yol tarifi fonksiyonu (window scope)
                window.navigateToShop = async function(shopId) {
                    try {
                        const shopResponse = await fetch(`/api/craftsmen/${shopId}`);
                        const shop = await shopResponse.json();

                        if(shop && navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(userPos => {
                                const userLatLng = [userPos.coords.latitude, userPos.coords.longitude];
                                const shopLatLng = [shop.location.coordinates[1], shop.location.coordinates[0]];
                                L.polyline([userLatLng, shopLatLng], {color: 'red'}).addTo(map);
                                map.fitBounds([userLatLng, shopLatLng], {padding: [40, 40]});
                            });
                        } else {
                            alert("Konum bilgisi alınamadı veya dükkan bulunamadı");
                        }
                    } catch (error) {
                        console.error('Dükkan bilgisi alınamadı:', error);
                        alert('Dükkan bilgisi alınamadı');
                    }
                }
            } catch (error) {
                console.error('Dükkanlar yüklenirken hata:', error);
                alert('Dükkanlar yüklenirken bir hata oluştu');
            }
        }
    }
});