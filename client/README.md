# 💬 Real-Time Chat App

A full-stack real-time chat application built using the MERN stack.  
Users can register, login, search for users, send friend requests and communicate through real-time messaging.

## 🚀 Live Demo

Frontend: https://real-time-chat-app-two-wine.vercel.app

Backend: https://real-time-chat-app-backend-1qh4.onrender.com

---

## ✨ Features

- User registration and login
- JWT-based authentication
- Protected API routes
- Search users by name or email
- Send and manage friend requests
- Accept and reject friend requests
- Friends list
- One-to-one conversations
- Real-time messaging using Socket.IO
- Online/offline user status
- Typing indicator
- Read/unread messages
- Edit messages
- Delete messages
- Message reactions
- Image message/file upload
- Profile picture upload
- Cloudinary image storage
- Responsive chat interface
- MongoDB database

---

## 🛠️ Tech Stack

### Frontend
- React.js
- React Router
- Tailwind CSS
- Axios
- Socket.IO Client
- Vite

### Backend
- Node.js
- Express.js
- Socket.IO
- JWT
- Bcrypt
- Multer
- Cloudinary

### Database
- MongoDB
- Mongoose

### Deployment
- Vercel — Frontend
- Render — Backend
- MongoDB Atlas — Database
- Cloudinary — Image Storage

---

## 📁 Project Structure

```text
real-time-chat-app/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── socket/
│   │   └── App.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── config/
│   │   └── cloudinary.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── conversationController.js
│   │   ├── friendRequestController.js
│   │   ├── messageController.js
│   │   └── userController.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── uploadMiddleware.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Conversation.js
│   │   └── Message.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── conversationRoutes.js
│   │   ├── friendRequestRoutes.js
│   │   ├── messageRoutes.js
│   │   └── userRoutes.js
│   │
│   ├── socket/
│   │   └── socket.js
│   │
│   ├── server.js
│   └── package.json
│
└── README.md