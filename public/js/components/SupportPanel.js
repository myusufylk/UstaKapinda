class SupportPanel {
    constructor() {
        this.activeChats = new Map();
        this.initializeUI();
        this.loadActiveChats();
    }

    initializeUI() {
        const panel = document.createElement('div');
        panel.className = 'support-panel';
        panel.innerHTML = `
            <div class="panel-header">
                <h2>Destek Paneli</h2>
                <div class="agent-status">
                    <span class="status-indicator"></span>
                    <span class="status-text">Çevrimiçi</span>
                </div>
            </div>
            <div class="active-chats-list"></div>
        `;

        const styles = `
            .support-panel {
                width: 300px;
                height: 100vh;
                background: white;
                border-right: 1px solid #dee2e6;
                display: flex;
                flex-direction: column;
            }

            .panel-header {
                padding: 20px;
                background: #f8f9fa;
                border-bottom: 1px solid #dee2e6;
            }

            .agent-status {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 10px;
            }

            .status-indicator {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: #28a745;
            }

            .active-chats-list {
                flex: 1;
                overflow-y: auto;
                padding: 15px;
            }

            .chat-item {
                padding: 15px;
                border: 1px solid #dee2e6;
                border-radius: 5px;
                margin-bottom: 10px;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .chat-item:hover {
                background: #f8f9fa;
            }

            .chat-item.active {
                border-color: #007bff;
                background: #e7f1ff;
            }

            .chat-item-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
            }

            .chat-item-customer {
                font-weight: bold;
            }

            .chat-item-time {
                color: #6c757d;
                font-size: 0.9em;
            }

            .chat-item-preview {
                color: #6c757d;
                font-size: 0.9em;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);

        document.body.appendChild(panel);
        this.panel = panel;
    }

    async loadActiveChats() {
        try {
            const response = await fetch('/api/chat/active', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const chats = await response.json();
            this.updateChatsList(chats);
        } catch (error) {
            console.error('Aktif sohbetler yüklenirken hata:', error);
        }
    }

    updateChatsList(chats) {
        const chatList = this.panel.querySelector('.active-chats-list');
        chatList.innerHTML = '';

        chats.forEach(chat => {
            const chatElement = this.createChatElement(chat);
            chatList.appendChild(chatElement);
            this.activeChats.set(chat._id, chat);
        });
    }

    createChatElement(chat) {
        const chatElement = document.createElement('div');
        chatElement.className = 'chat-item';
        chatElement.dataset.chatId = chat._id;

        const lastMessage = chat.messages[chat.messages.length - 1];
        const customerName = chat.customer ? chat.customer.name : 'Misafir';

        chatElement.innerHTML = `
            <div class="chat-item-header">
                <span class="chat-item-customer">${customerName}</span>
                <span class="chat-item-time">${this.formatTime(chat.updatedAt)}</span>
            </div>
            <div class="chat-item-preview">
                ${lastMessage ? lastMessage.content : 'Henüz mesaj yok'}
            </div>
        `;

        chatElement.addEventListener('click', () => this.selectChat(chat));

        return chatElement;
    }

    selectChat(chat) {
        // Aktif sohbeti seç
        const chatItems = this.panel.querySelectorAll('.chat-item');
        chatItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.chatId === chat._id) {
                item.classList.add('active');
            }
        });

        // Sohbet detaylarını göster
        this.showChatDetails(chat);
    }

    showChatDetails(chat) {
        // Sohbet detayları için yeni bir panel oluştur
        const detailsPanel = document.createElement('div');
        detailsPanel.className = 'chat-details-panel';
        detailsPanel.innerHTML = `
            <div class="chat-details-header">
                <h3>${chat.customer ? chat.customer.name : 'Misafir'}</h3>
                <button class="close-chat-btn">Sohbeti Kapat</button>
            </div>
            <div class="chat-messages"></div>
            <div class="chat-input-container">
                <textarea class="chat-input" placeholder="Mesajınızı yazın..."></textarea>
                <button class="send-message-btn">Gönder</button>
            </div>
        `;

        // Stil ekle
        const styles = `
            .chat-details-panel {
                position: fixed;
                right: 320px;
                top: 0;
                width: 400px;
                height: 100vh;
                background: white;
                border-left: 1px solid #dee2e6;
                display: flex;
                flex-direction: column;
            }

            .chat-details-header {
                padding: 20px;
                background: #f8f9fa;
                border-bottom: 1px solid #dee2e6;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .chat-messages {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
            }

            .chat-input-container {
                padding: 20px;
                border-top: 1px solid #dee2e6;
                display: flex;
                gap: 10px;
            }

            .chat-input {
                flex: 1;
                padding: 10px;
                border: 1px solid #dee2e6;
                border-radius: 5px;
                resize: none;
                height: 40px;
            }

            .send-message-btn {
                padding: 10px 20px;
                background: #007bff;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            }

            .close-chat-btn {
                padding: 8px 15px;
                background: #dc3545;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);

        // Event listener'ları ekle
        const sendButton = detailsPanel.querySelector('.send-message-btn');
        const input = detailsPanel.querySelector('.chat-input');
        const closeButton = detailsPanel.querySelector('.close-chat-btn');

        sendButton.addEventListener('click', () => this.sendMessage(chat._id, input));
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage(chat._id, input);
            }
        });
        closeButton.addEventListener('click', () => this.closeChat(chat._id));

        // Mevcut detay panelini kaldır ve yenisini ekle
        const existingPanel = document.querySelector('.chat-details-panel');
        if (existingPanel) {
            existingPanel.remove();
        }
        document.body.appendChild(detailsPanel);

        // Mesajları yükle
        this.loadChatMessages(chat._id);
    }

    async loadChatMessages(chatId) {
        try {
            const response = await fetch(`/api/chat/${chatId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const chat = await response.json();
            this.displayMessages(chat.messages);
        } catch (error) {
            console.error('Mesajlar yüklenirken hata:', error);
        }
    }

    displayMessages(messages) {
        const messagesContainer = document.querySelector('.chat-messages');
        messagesContainer.innerHTML = '';

        messages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.className = `message ${message.sender === localStorage.getItem('userId') ? 'sent' : 'received'}`;
            messageElement.textContent = message.content;
            messagesContainer.appendChild(messageElement);
        });

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async sendMessage(chatId, input) {
        const content = input.value.trim();
        if (!content) return;

        try {
            await fetch(`/api/chat/${chatId}/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ content })
            });

            input.value = '';
            this.loadChatMessages(chatId);
        } catch (error) {
            console.error('Mesaj gönderilirken hata:', error);
        }
    }

    async closeChat(chatId) {
        try {
            await fetch(`/api/chat/${chatId}/close`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const detailsPanel = document.querySelector('.chat-details-panel');
            if (detailsPanel) {
                detailsPanel.remove();
            }

            this.loadActiveChats();
        } catch (error) {
            console.error('Sohbet kapatılırken hata:', error);
        }
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Global olarak erişilebilir yapma
window.SupportPanel = SupportPanel; 