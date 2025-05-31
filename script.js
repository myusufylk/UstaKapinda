document.addEventListener('DOMContentLoaded', function() {
    // Sekme (tab) işlemleri
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = button.getAttribute('data-tab');
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(tabId + '-tab').classList.add('active');
        });
    });

    // Kullanıcı kayıt formu işlemleri
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = {
                name: document.getElementById('userName').value,
                email: document.getElementById('userEmail').value,
                phone: document.getElementById('userPhone').value,
                address: document.getElementById('userAddress').value,
                password: document.getElementById('userPassword').value
            };
            console.log('Kullanıcı Kaydı:', formData);
            alert('Kullanıcı kaydı başarıyla tamamlandı!');
            userForm.reset();
        });
    }

    // Dükkan kayıt formu işlemleri
    const shopForm = document.getElementById('shopForm');
    if (shopForm) {
        shopForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = {
                shopName: document.getElementById('shopName').value,
                ownerName: document.getElementById('ownerName').value,
                phone: document.getElementById('shopPhone').value,
                email: document.getElementById('shopEmail').value,
                address: document.getElementById('shopAddress').value,
                workingHours: document.getElementById('workingHours').value,
                password: document.getElementById('shopPassword').value
            };
            console.log('Dükkan Kaydı:', formData);
            alert('Dükkan kaydı başarıyla tamamlandı!');
            shopForm.reset();
        });
    }

    // Canlı destek işlemleri
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessage');
    const chatMessages = document.getElementById('chatMessages');

    function addMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'support'}`;
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${message}</p>
            </div>
            <div class="message-time">${time}</div>
        `;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    if (sendMessageBtn && messageInput && chatMessages) {
        sendMessageBtn.addEventListener('click', function() {
            const message = messageInput.value.trim();
            if (message) {
                addMessage(message, true);
                messageInput.value = '';
                setTimeout(() => {
                    addMessage('Mesajınız için teşekkür ederiz. En kısa sürede size dönüş yapacağız.');
                }, 1000);
            }
        });

        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessageBtn.click();
            }
        });
    }
});