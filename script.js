// N8N Webhook Configuration
const N8N_WEBHOOK_URL = 'https://odie-proxy.vercel.app/api/odie';
// Typing animation for dynamic subtitle text
const typingTexts = [
    "Kılıç Agency'nin yaratıcı zekâsıyım.",
    "Işık, kadraj ve fikirle ilgileniyorum.",
    "Ne yapmak istersin?"
];

let currentTextIndex = 0;
let currentCharIndex = 0;
let isDeleting = false;
let typingSpeed = 100;
let deletingSpeed = 50;
let pauseTime = 2000;

// Chat functionality
let chatHistory = [];

function typeText() {
    const typingElement = document.getElementById('typing-text');
    const currentText = typingTexts[currentTextIndex];
    
    if (isDeleting) {
        // Deleting text
        typingElement.textContent = currentText.substring(0, currentCharIndex - 1);
        currentCharIndex--;
        
        if (currentCharIndex === 0) {
            isDeleting = false;
            currentTextIndex = (currentTextIndex + 1) % typingTexts.length;
            setTimeout(typeText, 500);
            return;
        }
        
        setTimeout(typeText, deletingSpeed);
    } else {
        // Typing text
        typingElement.textContent = currentText.substring(0, currentCharIndex + 1);
        currentCharIndex++;
        
        if (currentCharIndex === currentText.length) {
            isDeleting = true;
            setTimeout(typeText, pauseTime);
            return;
        }
        
        setTimeout(typeText, typingSpeed);
    }
}

// Chat Functions
function focusChat() {
    document.getElementById('chat-input').focus();
}

// Handle first message and switch to chat interface
async function handleFirstMessage() {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // Disable input and button
    chatInput.disabled = true;
    sendBtn.disabled = true;
    
    // Switch to chat interface
    const landingPage = document.getElementById('landing-page');
    const chatInterface = document.getElementById('chat-interface');
    const navLinks = document.getElementById('nav-links');
    
    landingPage.style.display = 'none';
    chatInterface.style.display = 'flex';
    
    // Show navigation links after a short delay
    setTimeout(() => {
        navLinks.style.display = 'flex';
        navLinks.style.opacity = '0';
        navLinks.style.transform = 'translateY(20px)';
        
        // Animate in
        setTimeout(() => {
            navLinks.style.transition = 'all 0.5s ease';
            navLinks.style.opacity = '1';
            navLinks.style.transform = 'translateY(0)';
        }, 100);
    }, 1000);
    
    // Add user message to chat
    addMessage(message, true);
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Get response from N8N
        const response = await sendToN8N(message);
        
        // Hide typing indicator
        hideTypingIndicator();
        
        // Add bot response to chat
        addMessage(response);
        
    } catch (error) {
        hideTypingIndicator();
        addMessage('Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
        // Focus chat input
        document.getElementById('chat-input-chat').focus();
    }
}

// Add message to chat
function addMessage(content, isUser = false) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = isUser ? 'message user-message' : 'message bot-message';
    
    // Create avatar
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = isUser ? 'U' : '';
    
    // Create message content
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    messageText.textContent = content;
    
    messageContent.appendChild(messageText);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    messageDiv.id = 'typing-indicator';
    
    // Create avatar
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '';
    
    // Create typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator active';
    
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'typing-dot';
        typingDiv.appendChild(dot);
    }
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(typingDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Send message to N8N Webhook
async function sendToN8N(message) {
    try {
        console.log('Sending message to N8N webhook:', message);
        
        // Add user message to history
        chatHistory.push({
            role: 'user',
            parts: [{ text: message }]
        });
        
        const requestBody = {
            message: message,
            chatHistory: chatHistory,
            timestamp: new Date().toISOString()
        };
        
        console.log('Request body:', JSON.stringify(requestBody, null, 2));
        
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('N8N Error Response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('N8N Response:', data);
        
        if (data.response) {
            const botResponse = data.response;
            
            // Add bot response to history
            chatHistory.push({
                role: 'model',
                parts: [{ text: botResponse }]
            });
            
            return botResponse;
        } else {
            console.error('Invalid response format:', data);
            throw new Error('Invalid response format from N8N webhook');
        }
        
    } catch (error) {
        console.error('Error calling N8N webhook:', error);
        return `Üzgünüm, şu anda bir hata oluştu: ${error.message}. Lütfen tekrar deneyin.`;
    }
}

// Handle send message
async function handleSendMessage() {
    const chatInput = document.getElementById('chat-input-chat');
    const sendBtn = document.getElementById('send-btn-chat');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // Disable input and button
    chatInput.disabled = true;
    sendBtn.disabled = true;
    
    // Add user message to chat
    addMessage(message, true);
    
    // Clear input
    chatInput.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Get response from N8N
        const response = await sendToN8N(message);
        
        // Hide typing indicator
        hideTypingIndicator();
        
        // Add bot response to chat
        addMessage(response);
        
    } catch (error) {
        hideTypingIndicator();
        addMessage('Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
        // Re-enable input and button
        chatInput.disabled = false;
        sendBtn.disabled = false;
        chatInput.focus();
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Start typing animation after a short delay
    setTimeout(typeText, 1000);
    
    // Focus chat input after typing animation
    setTimeout(focusChat, 2000);
    
    // Landing page send button event listener
    const sendBtn = document.getElementById('send-btn');
    sendBtn.addEventListener('click', handleFirstMessage);
    
    // Landing page enter key to send message
    const chatInput = document.getElementById('chat-input');
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleFirstMessage();
        }
    });
    
    // Chat interface send button event listener
    const sendBtnChat = document.getElementById('send-btn-chat');
    sendBtnChat.addEventListener('click', handleSendMessage);
    
    // Chat interface enter key to send message
    const chatInputChat = document.getElementById('chat-input-chat');
    chatInputChat.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    
    // Add some interactive effects
    document.addEventListener('mousemove', function(e) {
        const cursor = document.querySelector('.cursor');
        if (cursor) {
            // Subtle cursor animation based on mouse movement
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            
            cursor.style.transform = `translate(${x * 2}px, ${y * 2}px)`;
        }
    });
});
