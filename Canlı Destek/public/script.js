const socket = io();
const messageSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const fileInput = document.getElementById('fileInput');
const emojiButton = document.getElementById('emojiButton');
const typingIndicator = document.getElementById('typingIndicator');
const themeToggle = document.getElementById('themeToggle');

let typingTimeout;
let isAdmin = false;
let adminUsername = '';

// Ses ayarları
messageSound.volume = 0.5;

// Tema değiştirme fonksiyonu
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Tema ikonunu güncelle
    const icon = themeToggle.querySelector('i');
    icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Sayfa yüklendiğinde kaydedilmiş temayı uygula
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const icon = themeToggle.querySelector('i');
    icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
});

// Tema değiştirme butonu event listener
themeToggle.addEventListener('click', toggleTheme);

// Kullanıcı adını al
let username = prompt('Lütfen kullanıcı adınızı girin:') || 'Anonim';

// Socket.io bağlantısı
socket.emit('userJoined', {
    username: username,
    id: socket.id
});

// Admin girişi
function loginAsAdmin() {
    const adminName = prompt('Admin kullanıcı adınızı girin:');
    if (adminName) {
        adminUsername = adminName;
        const password = prompt('Admin şifresini girin:');
        if (password) {
            socket.emit('adminLogin', { 
                username: adminUsername,
                password: password 
            });
        }
    }
}

// Admin durumu kontrolü
socket.on('adminStatus', (data) => {
    isAdmin = data.isAdmin;
    if (isAdmin) {
        alert('Admin olarak giriş yaptınız!');
        document.getElementById('sendSystemMessageBtn').style.display = 'block';
        username = adminUsername;
    } else {
        alert('Admin girişi başarısız!');
    }
});

// Mesaj gönderme fonksiyonu
function sendMessage() {
    const content = messageInput.value.trim();
    
    if (content) {
        const message = {
            id: Date.now(),
            content: content,
            type: 'text',
            sender: username,
            timestamp: new Date(),
            status: 'sending',
            isSystem: false
        };

        appendMessage(message);
        socket.emit('sendMessage', message);
        messageInput.value = '';
    }
}

// Mesaj ekleme fonksiyonu
function appendMessage(message) {
    const messageContainer = document.createElement('div');
    messageContainer.className = `message ${message.sender === username ? 'sent' : 'received'}`;
    messageContainer.setAttribute('data-message-id', message.id);

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    messageContent.innerHTML = `
        <div class="message-bubble">
            <div class="message-text">${message.content}</div>
            <div class="message-info">
                <span class="message-time">${formatTime(message.timestamp)}</span>
                ${message.sender === username ? '<span class="message-status">✓</span>' : ''}
            </div>
        </div>
    `;

    messageContainer.appendChild(messageContent);
    chatMessages.appendChild(messageContainer);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    if (message.sender !== username) {
        playNotificationSound();
    }
}

// Zaman formatı
function formatTime(date) {
    return new Date(date).toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Event Listeners
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Yazıyor göstergesi
messageInput.addEventListener('input', () => {
    socket.emit('typing', { username: username });
    
    clearTimeout(typingTimeout);
    typingIndicator.textContent = `${username} yazıyor...`;
    typingIndicator.style.display = 'block';
    
    typingTimeout = setTimeout(() => {
        typingIndicator.style.display = 'none';
    }, 1000);
});

// Dosya yükleme
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        sendMessage(data.path, 'image');
    } catch (error) {
        console.error('Dosya yükleme hatası:', error);
    }
});

// Mesaj alma
socket.on('newMessage', (message) => {
    const existingMessage = document.querySelector(`[data-message-id="${message.id}"]`);
    if (!existingMessage) {
        appendMessage(message);
    }
});

socket.on('messageStatusUpdated', (messageId) => {
    const messageDiv = document.getElementById(`message-${messageId}`);
    if (messageDiv) {
        const statusSpan = messageDiv.querySelector('.status');
        if (statusSpan) {
            statusSpan.textContent = '✓✓';
        }
    }
});

socket.on('messageRead', (messageId) => {
    const messageDiv = document.getElementById(`message-${messageId}`);
    if (messageDiv) {
        const statusSpan = messageDiv.querySelector('.status');
        if (statusSpan) {
            statusSpan.textContent = '✓✓';
            statusSpan.style.color = '#4fc3f7'; // Okundu durumu için mavi renk
        }
    }
});

// Kullanıcı yazıyor bildirimi
socket.on('userTyping', (data) => {
    if (data.username !== username) {
        typingIndicator.textContent = `${data.username} yazıyor...`;
        typingIndicator.style.display = 'block';
        
        setTimeout(() => {
            typingIndicator.style.display = 'none';
        }, 1000);
    }
});

// Sistem mesajı gönderme
function sendSystemMessage() {
    if (!isAdmin) {
        alert('Bu işlem için admin yetkisi gerekiyor!');
        return;
    }
    
    const message = prompt('Sistem mesajını girin:');
    if (message) {
        socket.emit('sendSystemMessage', {
            message: message,
            username: 'Yardımcı Usta'
        });
    }
} 