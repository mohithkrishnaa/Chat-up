let socket = null;
let currentUser = "";
let conversations = {}; // { username: [{text, side, time}] }

function connect() {
    currentUser = document.getElementById("username").value.trim();
    const errorEl = document.getElementById("login-error");

    if (!currentUser) {
        errorEl.innerText = "Please enter a valid username";
        errorEl.style.color = "#ff4e72";
        errorEl.style.marginTop = "10px";
        return;
    }

    // Connect to local server
    socket = new WebSocket("ws://127.0.0.1:8765");

    socket.onopen = () => {
        socket.send(currentUser);
        // Hide login overlay
        document.getElementById("login-overlay").style.display = "none";
        // Set my avatar title (optional demo flair)
        document.getElementById("my-avatar-img").src = `https://ui-avatars.com/api/?name=${currentUser}&background=a13bf7&color=fff`;
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "users") {
            updateUserList(data.users);
        } else {
            // Handle chat message
            const sender = data.from;

            // Initialize conversation if needed
            if (!conversations[sender]) {
                conversations[sender] = [];
            }

            // Store message with timestamp
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const msgObj = { text: data.message, side: "left", time: timeStr, senderName: sender };
            conversations[sender].push(msgObj);

            // Re-render contact list to show latest message snippet & unread logic
            renderContactSnippet(sender, data.message, timeStr);

            // If we are currently chatting with this sender, show the message
            const currentReceiver = document.getElementById("receiver").value;
            if (currentReceiver === sender) {
                renderMessage(msgObj);
            }
        }
    };

    socket.onerror = () => {
        errorEl.innerText = "Connection error. Is the server running?";
        errorEl.style.color = "#ff4e72";
        errorEl.style.marginTop = "10px";
    };

    socket.onclose = (e) => {
        if (e.reason === "Username taken") {
            errorEl.innerText = "Username is already taken by another session.";
            errorEl.style.color = "#ff4e72";
            errorEl.style.marginTop = "10px";
        }
    };
}

// Generate the sidebar user list
function updateUserList(users) {
    const userList = document.getElementById("user-list");
    // Preserve snippets
    const existingContent = {};
    document.querySelectorAll(".contact-item").forEach(el => {
        const name = el.getAttribute("data-user");
        const subtitle = el.querySelector(".contact-subtitle").innerText;
        const time = el.querySelector(".contact-time").innerText;
        existingContent[name] = { subtitle, time };
    });

    userList.innerHTML = "";

    const currentReceiver = document.getElementById("receiver").value;

    users.forEach(user => {
        if (user === currentUser) return; // Don't show self

        const div = document.createElement("div");
        div.className = "contact-item";
        div.setAttribute("data-user", user);

        // Highlight selected user
        if (user === currentReceiver) {
            div.classList.add("active");
        }

        // Determine avatar
        const hashStr = Array.from(user).reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const colors = ["ff4e72", "a13bf7", "00bcd4", "ff9800", "4caf50", "e91e63"];
        const color = colors[hashStr % colors.length];
        const avatarUrl = `https://ui-avatars.com/api/?name=${user}&background=${color}&color=fff`;

        // Restore snippets or default
        let prevSubtitle = existingContent[user] ? existingContent[user].subtitle : "Tap to chat...";
        let prevTime = existingContent[user] ? existingContent[user].time : "";

        div.innerHTML = `
            <div class="contact-avatar">
                <img src="${avatarUrl}" alt="${user}">
                <div class="status-dot"></div>
            </div>
            <div class="contact-info">
                <div class="contact-name-row">
                    <span class="contact-name">${user}</span>
                    <span class="contact-time">${prevTime}</span>
                </div>
                <div class="contact-subtitle-row">
                    <span class="contact-subtitle">${prevSubtitle}</span>
                    <!-- Optional unread badge can go here -->
                </div>
            </div>
        `;

        // Click handler to switch chat
        div.onclick = () => {
            // Update visual selection
            document.querySelectorAll(".contact-item").forEach(el => el.classList.remove("active"));
            div.classList.add("active");

            // Set active receiver
            document.getElementById("receiver").value = user;

            // Update main chat header
            document.getElementById("active-chat-name").innerText = user;
            document.getElementById("active-chat-status").className = "status-online";
            document.getElementById("active-chat-status").innerText = "Active Now";
            const headerAvatar = document.getElementById("active-chat-avatar");
            headerAvatar.src = avatarUrl;
            headerAvatar.style.display = "block";

            // Update Profile Panel (Column 4)
            document.getElementById("profile-pane-name").innerText = user;
            document.getElementById("profile-pane-status").className = "status-online";
            document.getElementById("profile-pane-status").innerText = "Active Now";
            document.getElementById("profile-pane-avatar").src = avatarUrl;

            // Load history
            loadConversation(user);
        };

        userList.appendChild(div);
    });
}

function renderContactSnippet(user, msgSnippet, timeStr) {
    const contactItem = document.querySelector(`.contact-item[data-user="${user}"]`);
    if (contactItem) {
        contactItem.querySelector(".contact-time").innerText = timeStr;
        contactItem.querySelector(".contact-subtitle").innerText = msgSnippet;
    }
}

function loadConversation(user) {
    const chatBox = document.getElementById("chat-box");
    chatBox.innerHTML = ""; // Clear current view

    // Verify conversation existence
    if (conversations[user]) {
        conversations[user].forEach(msg => {
            renderMessage(msg);
        });
    }
}

function sendMessage() {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    const receiver = document.getElementById("receiver").value;
    const messageInput = document.getElementById("message");
    const message = messageInput.value.trim();

    if (!receiver || !message) return;

    if (!conversations[receiver]) {
        conversations[receiver] = [];
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const msgObj = { text: message, side: "right", time: timeStr, senderName: currentUser };
    conversations[receiver].push(msgObj);

    socket.send(JSON.stringify({
        to: receiver,
        message: message
    }));

    // Update snippet
    renderContactSnippet(receiver, "You: " + message, timeStr);

    // Render locally
    renderMessage(msgObj);

    messageInput.value = "";
    messageInput.focus();
}

// Bind Enter key in chat input
document.getElementById('message').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Bind Enter key in login 
document.getElementById('username').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        connect();
    }
});

function renderMessage(msgObj) {
    const chatBox = document.getElementById("chat-box");

    const wrapper = document.createElement("div");
    wrapper.className = `message-wrapper ${msgObj.side === 'right' ? 'sent' : 'received'}`;

    // We can pull the avatar dynamically to match the user list, or just use placeholders. 
    // For sent messages (right), we use current user's avatar.
    // For received (left), we use the sender's avatar.
    const nameToHash = msgObj.side === 'right' ? currentUser : msgObj.senderName;
    const colors = ["ff4e72", "a13bf7", "00bcd4", "ff9800", "4caf50", "e91e63"];
    const hashStr = Array.from(nameToHash).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const color = colors[hashStr % colors.length];
    const avatarUrl = `https://ui-avatars.com/api/?name=${nameToHash}&background=${color}&color=fff`;

    wrapper.innerHTML = `
        <img src="${avatarUrl}" class="msg-avatar" alt="Avatar">
        <div class="msg-content">
            <div class="msg-bubble">${msgObj.text}</div>
            <div class="msg-time">${msgObj.time}</div>
        </div>
    `;

    chatBox.appendChild(wrapper);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Menu Toggle Logic
function toggleChatOptions() {
    const menu = document.getElementById("chat-options-menu");
    menu.style.display = menu.style.display === "none" ? "block" : "none";
}

function clearChat() {
    const receiver = document.getElementById("receiver").value;
    if (!receiver) {
        alert("Select a user to clear chat.");
        return;
    }
    document.getElementById("chat-box").innerHTML = "";
    if (conversations[receiver]) {
        conversations[receiver] = [];
    }
    document.getElementById("chat-options-menu").style.display = "none";
    renderContactSnippet(receiver, "Chat cleared", "");
}

// Emoji Picker Logic
function toggleEmojiPicker() {
    const picker = document.getElementById("emoji-picker");
    picker.style.display = picker.style.display === "none" ? "grid" : "none";
}

function insertEmoji(emoji) {
    const input = document.getElementById("message");
    input.value += emoji;
    input.focus();
}

// Close dropdowns if clicked outside
document.addEventListener("click", function (event) {
    const chatOptionsBtn = document.getElementById("chat-options-btn");
    const chatOptionsMenu = document.getElementById("chat-options-menu");
    const emojiBtn = document.getElementById("emoji-btn");
    const emojiPicker = document.getElementById("emoji-picker");

    if (chatOptionsBtn && !chatOptionsBtn.contains(event.target) && !chatOptionsMenu.contains(event.target)) {
        chatOptionsMenu.style.display = "none";
    }

    if (emojiBtn && !emojiBtn.contains(event.target) && !emojiPicker.contains(event.target)) {
        emojiPicker.style.display = "none";
    }
});
