// Toggle chatbot visibility
function toggleChat() {
    const chatbox = document.getElementById("chatbot");
    chatbox.style.display = chatbox.style.display === "flex" ? "none" : "flex";
}

// Open chatbot when FOODCHOW AI button is clicked
document.querySelector(".ray-btn").addEventListener("click", function() {
    toggleChat();
});

function sendMessage() {
    const inputField = document.getElementById("user-input");
    const message = inputField.value.trim();
    if (message === "") return;

    const chatBody = document.getElementById("chat-body");

     // Append user message to chat
     const userMessageContainer = document.createElement("div");
     userMessageContainer.className = "message-container user-message-container";
 
     const userIcon = document.createElement("img");
     userIcon.src ="static/icon-5359553_1280.webp";
     userIcon.alt = "User Icon";
     userIcon.className = "message-icon";
 
     const userMessage = document.createElement("div");
     userMessage.className = "user-message";
     userMessage.innerText = message;
 
     
     userMessageContainer.appendChild(userMessage);
     userMessageContainer.appendChild(userIcon);
     chatBody.appendChild(userMessageContainer);

    // Show "typing..." indicator
    const typingIndicator = document.createElement("div");
    typingIndicator.className = "bot-message typing-indicator";
    typingIndicator.innerText = "Bot is typing";
    chatBody.appendChild(typingIndicator);

    // Scroll to latest message
    chatBody.scrollTop = chatBody.scrollHeight;

    // Send message to backend
    fetch("http://192.168.1.42:5000/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: message }),
        })
        .then(response => response.json())
        .then(data => {
            let botReply = data.response;

            // Ensure botReply is a string
            if (typeof botReply !== "string") {
                botReply = JSON.stringify(botReply, null, 2);
            }

            // Remove typing indicator
            chatBody.removeChild(typingIndicator);

            // Type bot's response letter by letter
            typeMessage(botReply, chatBody);
        })
        .catch(error => {
            console.error("Error:", error);

            // Remove typing indicator
            chatBody.removeChild(typingIndicator);

            // Show error message in chat
            typeMessage("⚠️ Error connecting to the AI assistant.", chatBody);
        });

    inputField.value = ""; // Clear input field
}

// Function to display message with **letter-by-letter** effect
function typeMessage(text, chatBody) {
    // Create bot message container
    const botMessageContainer = document.createElement("div");
    botMessageContainer.className = "message-container bot-message-container";

    // Add bot icon
    const botIcon = document.createElement("img");
    botIcon.src = "static/chatbot-data.png"; // Replace with your bot icon path
    botIcon.alt = "Bot Icon";
    botIcon.className = "message-icon";

    // Add bot message
    const botMessage = document.createElement("div");
    botMessage.className = "bot-message";

    // Append icon and message to container
    botMessageContainer.appendChild(botIcon);
    botMessageContainer.appendChild(botMessage);

    // Append container to chat body
    chatBody.appendChild(botMessageContainer);

    // Type the message letter by letter
    let i = 0;
    function typingEffect() {
        if (i < text.length) {
            botMessage.innerHTML += text[i]; // Append letter by letter
            i++;
            setTimeout(typingEffect, 25); // Adjust speed (lower = faster)
        }

        // Scroll to latest message
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    typingEffect();
}
// Allow "Enter" key to send message
document.getElementById("user-input").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});