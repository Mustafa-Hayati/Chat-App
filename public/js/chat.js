const socket = io();

// Elements
const messageForm = document.getElementById("message-form");
const messageFormInput = messageForm.message;
const messageFormButton = document.getElementsByTagName("button")[0];
const sendLocationButton = document.getElementById("send-location");
const messages = document.getElementById("messages");
const sidebar = document.getElementById("sidebar");

// Templates
const messageTemplate = document.getElementById("message-template").innerHTML;
const locationTemplate = document.getElementById("location-message-template").innerHTML;
const sidebarTemplate = document.getElementById("sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

const autoscroll = () => {
    // New message element
    const newMessage = messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = messages.offsetHeight

    // Height of messages container
    const containerHeight = messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        messages.scrollTop = messages.scrollHeight
    }
}

socket.on("message", message => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm a")
    });
    messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
});

socket.on("locationMessage", (message) => {
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format("h:mm a")     
    });
    messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
});

socket.on("roomData", ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    sidebar.innerHTML = html;
});

messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    // messageFormButton.setAttribute("disabled", "disabled");
    messageFormButton.disabled = true;
    let message = messageFormInput.value
    socket.emit("sendMessage", message, (error) => {
        messageFormButton.disabled = false;
        // messageFormButton.removeAttribute("disabled");
        messageFormInput.value = "";
        messageFormInput.focus();
        if (error) {
            return console.log(error);
        } else {
            console.log("Message delivered!");
        }
    });
});

sendLocationButton.addEventListener("click", (e) => {
    e.preventDefault();
    if (!navigator.geolocation) {
        return alert("Geolocation is not supported by your browser.");
    }
    sendLocationButton.setAttribute("disabled", "disabled");
    // sendLocationButton.disabled = true;
    navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        socket.emit("sendLocation", {
            latitude,
            longitude
        }, () => {
            console.log("Location Shared!");
            sendLocationButton.removeAttribute("disabled");
        });
    });
});

socket.emit("join", {
    username,
    room
}, (error) => {
    if (error) {
        alert(error);
        location.href = "/";
    }
});