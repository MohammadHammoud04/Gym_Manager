# B7Gym – Gym Management System

A full-stack desktop application designed to help gyms manage members, subscriptions, payments, and financial performance efficiently.

Built using React, Node.js, MongoDB, and Electron.

---

## 📌 Overview

B7Gym is a business-focused management system that centralizes gym operations into one structured platform.  
The system allows administrators to manage memberships, track payments, monitor revenue, and analyze financial performance through dashboards.

The goal of the application is to replace manual tracking systems with a structured, scalable digital solution.

---

## 🚀 Features

### 👥 Member Management
- Add, edit, and delete members
- Assign membership plans
- Track active and expired subscriptions
- Manage personal training sessions

### 💳 Payment & Subscription Tracking
- Record membership payments
- Track expenses and revenue
- Monitor transaction history
- Generate financial insights

### 📊 Dashboard & Analytics
- Revenue and expense overview
- Sales performance tracking
- Member activity monitoring
- Financial breakdown visualization
- Export and import data

### 🔐 Backend Architecture
- RESTful API structure
- Modular route organization
- JSON-based request handling
- Structured controller logic

---

## 🛠 Tech Stack

### Frontend
- React
- JavaScript (ES6+)
- CSS

### Backend
- Node.js
- Express
- REST API Design

### Database
- MongoDB

### Desktop Integration
- Electron

---

## 🏗 System Architecture

Client (React + Electron)
        ↓
Node.js / Express REST API
        ↓
MongoDB Database

The application follows a modular backend structure using routes, controllers, and models for scalability and maintainability.

---

## 📂 Project Structure

- /client → React frontend
- /server → Express backend
- server/routes
- server/models

---

## ⚙ Installation & Setup

- git clone https://github.com/MohammadHammoud04/Gym_Manager.git
- cd Gym_Manager

### 2️⃣ Install dependencies

Frontend:
cd client
npm install


Backend:
cd server
npm install

Root:
npm install

### 3️⃣ Environment Variables

- Create a `.env` file inside `/server`:
- Follow the .env.example file

### 4️⃣ Run the application

- cd ..
- npm run dev

---
## 📸 Screenshots

![Capture](https://github.com/user-attachments/assets/12e8c529-74f3-4982-8644-856e23011de6)

![Capture2](https://github.com/user-attachments/assets/b2f5ebc6-9d20-431c-84cd-33ee010ad595)


---

## Notes

You should note that the buttons for syncing the atlas with the local database and vice versa are removed and should be added as well as the syncRoutes.js file, they should be added if you want to use the feature.

---
## 👨‍💻 Author

Mohammad Hammoud  
Full-Stack Developer
