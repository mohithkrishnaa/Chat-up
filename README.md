# Chat-up! 💬⚡

Chat-up! is a real-time, lightweight chat application built with a modern and responsive user interface. It features a sleek dark-themed design and allows users to connect and chat instantly using WebSockets.

## ✨ Features

- **Real-Time Messaging**: Built on WebSockets for instant, low-latency communication.
- **Dynamic Avatars**: Automatically generated user avatars based on usernames.
- **Chat Management**: Option to cleanly clear your chat history with specific users.
- **Live Active Users**: See who is currently online in the contact sidebar.
- **Modern UI/UX**: A highly responsive, glassmorphic dark theme with vibrant gradients.

## 🚀 Tech Stack

- **Frontend**: HTML5, CSS, and JavaScript.
- **Backend**: Python 3.12+ 
- **Networking**: `websockets` (Python library).

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.8 or higher installed on your machine.

### 1. Clone the repository
```bash
git clone https://github.com/mohithkrishnaa/Chat-up.git
cd Chat-up
```

### 2. Install backend dependencies
You will need the `websockets` package to run the server.
```bash
pip install websockets
```

### 3. Run the Backend Server
Navigate to the backend directory and start the WebSocket server:
```bash
cd backend
python server.py
```
*The server will start running on `ws://localhost:8765`.*

### 4. Run the Frontend Client
You can run the frontend by opening a local HTTP server in the `frontend` directory. Open a new terminal window:
```bash
cd frontend
python -m http.server 8000
```

### 5. Access the Application
Open your web browser and navigate to:
```text
http://localhost:8000
```

---

## 📄 License
This project is open-source and available under the MIT License.
