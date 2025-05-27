// Socket.IO bağlantısı
const socket = io();

// DOM elementleri
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const authButtons = document.getElementById('authButtons');
const userProfile = document.getElementById('userProfile');
const liveSupport = document.getElementById('liveSupport');
const supportMessages = document.getElementById('supportMessages');
const messageInput = document.getElementById('messageInput');

// Kullanıcı durumu
let currentUser = null;

// Modal işlemleri
function showLoginModal() {
    loginModal.classList.add('active');
}

function showRegisterModal() {
    registerModal.classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Giriş işlemi
async function login(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data.user;
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            updateUIAfterAuth();
            closeModal('loginModal');
            
            // Socket.IO kimlik doğrulama
            socket.emit('authenticate', currentUser.id);
        } else {
            alert(data.message || 'Giriş başarısız');
        }
    } catch (error) {
        console.error('Giriş hatası:', error);
        alert('Giriş işlemi sırasında bir hata oluştu');
    }
}

// Kayıt işlemi
async function register(event) {
    event.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('registerRole').value;

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password, role })
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data.user;
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            updateUIAfterAuth();
            closeModal('registerModal');
            
            // Socket.IO kimlik doğrulama
            socket.emit('authenticate', currentUser.id);
        } else {
            alert(data.message || 'Kayıt başarısız');
        }
    } catch (error) {
        console.error('Kayıt hatası:', error);
        alert('Kayıt işlemi sırasında bir hata oluştu');
    }
}

// Çıkış işlemi
function logout() {
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateUIAfterAuth();
    socket.emit('authenticate', null);
}

// UI güncelleme
function updateUIAfterAuth() {
    if (currentUser) {
        authButtons.classList.add('hidden');
        userProfile.classList.remove('hidden');
    } else {
        authButtons.classList.remove('hidden');
        userProfile.classList.add('hidden');
    }
}

// Canlı destek işlemleri
let isSupportMinimized = false;

function toggleSupport() {
    if (isSupportMinimized) {
        liveSupport.style.height = '400px';
        supportMessages.style.display = 'block';
        document.querySelector('.support-input').style.display = 'flex';
    } else {
        liveSupport.style.height = '40px';
        supportMessages.style.display = 'none';
        document.querySelector('.support-input').style.display = 'none';
    }
    isSupportMinimized = !isSupportMinimized;
}

function sendMessage() {
    const message = messageInput.value.trim();
    if (message && currentUser) {
        socket.emit('sendMessage', {
            receiverId: 'support', // Destek ekibi ID'si
            message: message
        });
        
        addMessage(message, 'user');
        messageInput.value = '';
    }
}

function addMessage(message, type) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    supportMessages.appendChild(messageElement);
    supportMessages.scrollTop = supportMessages.scrollHeight;
}

// Mesaj yazıyor durumu
let typingTimeout;
messageInput.addEventListener('input', () => {
    if (currentUser) {
        socket.emit('typing', {
            receiverId: 'support',
            isTyping: true
        });

        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            socket.emit('typing', {
                receiverId: 'support',
                isTyping: false
            });
        }, 1000);
    }
});

// Socket.IO event listeners
socket.on('newMessage', (data) => {
    addMessage(data.message.message, data.sender === currentUser?.id ? 'user' : 'support');
});

socket.on('userTyping', (data) => {
    // Kullanıcı yazıyor göstergesi
    const typingIndicator = document.getElementById('typingIndicator');
    if (data.isTyping) {
        if (!typingIndicator) {
            const indicator = document.createElement('div');
            indicator.id = 'typingIndicator';
            indicator.className = 'typing-indicator';
            indicator.textContent = 'Destek ekibi yazıyor...';
            supportMessages.appendChild(indicator);
        }
    } else if (typingIndicator) {
        typingIndicator.remove();
    }
});

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    // LocalStorage'dan kullanıcı bilgilerini al
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUIAfterAuth();
        socket.emit('authenticate', currentUser.id);
    }

    // Smooth scroll için
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Enter tuşu ile mesaj gönderme
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
}); 