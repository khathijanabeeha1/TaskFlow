# TaskFlow 🚀

A full-stack task management application built with React, Node.js, Express, and MongoDB.

TaskFlow helps users organize their daily tasks, manage priorities, track completion, and keep their tasks securely separated between user accounts.

## ✨ Features

- 🔐 User Signup and Login
- 👤 User-specific task management
- ➕ Create tasks
- ✏️ Edit tasks
- 🗑️ Delete tasks
- ✅ Mark tasks as completed
- 🔍 Search tasks
- 📂 Filter tasks by category
- ⭐ Task priority management
- 📅 Due dates
- 📊 Productivity summary
- 🌙 Dark mode
- 💾 MongoDB database persistence
- 🔒 User task isolation
- 📱 Responsive interface

## 🛠️ Technologies Used

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- bcryptjs
- CORS
- dotenv

## 📁 Project Structure

```text
TaskFlow/
│
├── backend/
│   ├── models/
│   │   ├── Task.js
│   │   └── User.js
│   ├── .gitignore
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── README.md