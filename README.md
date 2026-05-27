# ✨ LUMEHEAVEN – Luxury Jewelry E-Commerce Platform

<p align="center">
  <img src="https://img.shields.io/badge/MERN-Stack-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-black?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Database-MongoDB-brightgreen?style=for-the-badge" />
</p>

---

<h1 align="center">💎 LUMEHEAVEN</h1>

<p align="center">
A premium full-stack MERN jewelry e-commerce platform with secure role-based authentication, beautiful UI, product management, order handling, and powerful admin controls.
</p>

---

# 🌟 About The Project

**LUMEHEAVEN** is an advanced luxury jewelry shopping platform developed using the **MERN Stack**.

The platform is designed with two dedicated sections:

---

# 👩‍💼 Customer Section

Customers can:

- Register & Login securely
- Browse luxury jewelry collections
- Explore categories and subcategories
- View detailed product pages
- Add products to cart
- Place orders
- Enjoy smooth animations and responsive UI

---

# 🛠️ Manager/Admin Section

Managers have complete control over the platform including:

- Secure Admin Login
- Add Categories
- Add Subcategories
- Add Products
- Update Products
- Delete Products
- Manage Inventory
- View & Manage Orders
- Access Full Admin Dashboard

---

# 🚀 Tech Stack

## Frontend
- React.js
- Vite
- React Router DOM
- Framer Motion
- React Hot Toast
- Axios
- Tailwind CSS

## Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcrypt.js

---

# 📁 Project Structure

```bash
LUMEHEAVEN/
│
├── client/                 # React Frontend
│
├── server/                 # Express Backend
│
├── DEPLOYMENT.md           # Deployment Guide
│
├── render.yaml             # Render Deployment Config
│
└── README.md
```

---

# 🔐 Authentication System

LUMEHEAVEN uses secure **JWT Authentication** with **Role-Based Authorization**.

## Roles
- Customer
- Manager/Admin

Protected routes ensure only managers can access admin functionalities.

---

# 👑 Default Manager Credentials

⚠️ These credentials are required to access the **Manager/Admin Dashboard**.

## Manager Login Credentials

```env
DEFAULT_MANAGER_EMAIL=manager@lumeheaven.com
DEFAULT_MANAGER_PASSWORD=Manager@123
```

| Role | Email | Password |
|------|------|------|
| Manager/Admin | manager@lumeheaven.com | Manager@123 |

---

# ⚙️ Complete Setup Guide

# 🖥️ Step 1 — Clone Repository

```bash
git clone https://github.com/your-username/LUMEHEAVEN.git
```

---

# 📂 Step 2 — Navigate Into Project

```bash
cd LUMEHEAVEN
```

---

# ⚙️ Step 3 — Backend Setup

## Navigate to Server Folder

```bash
cd server
```

---

## Install Dependencies

```bash
npm install
```

---

## Create `.env` File

Create a `.env` file inside the `server` folder.

Example:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_super_secret_key

DEFAULT_MANAGER_EMAIL=manager@lumeheaven.com

DEFAULT_MANAGER_PASSWORD=Manager@123
```

---

## Start Backend Server

```bash
npm run dev
```

Backend will run on:

```bash
http://localhost:5000
```

---

# 💻 Step 4 — Frontend Setup

## Open New Terminal

Navigate to client folder:

```bash
cd client
```

---

## Install Dependencies

```bash
npm install
```

---

## Create `.env` File

Create `.env` inside `client` folder.

Example:

```env
VITE_API_URL=http://localhost:5000
```

---

## Start Frontend

```bash
npm run dev
```

Frontend will run on:

```bash
http://localhost:5173
```

---

# 🌐 How To Use The Platform

# 👤 Customer Usage

## Register/Login
- Open frontend URL
- Create customer account
- Login securely

## Browse Products
- Explore jewelry collections
- View categories & subcategories
- Open product details

## Shopping
- Add items to cart
- Place orders
- Enjoy responsive shopping experience

---

# 👑 Manager/Admin Usage

## Login as Manager

Use the following credentials:

```env
Email: manager@lumeheaven.com
Password: Manager@123
```

---

## Access Admin Dashboard

After login, managers can:

- Add Categories
- Add Subcategories
- Add Products
- Update Existing Products
- Delete Products
- Manage Orders
- Control Inventory
- Manage Platform Operations

---

# ✨ Features

# 🛍️ Customer Features

- Secure Authentication
- Browse Jewelry Products
- Product Categories
- Add to Cart
- Place Orders
- Responsive UI
- Toast Notifications
- Smooth Animations

---

# 🛠️ Admin Features

- Product CRUD Operations
- Category Management
- Subcategory Management
- Inventory Control
- Order Management
- Secure Dashboard Access

---

# 🔥 API Endpoints

# 🔐 Authentication APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Customer Registration |
| POST | `/api/auth/login` | Customer/Admin Login |
| GET | `/api/auth/me` | Get Current User |

---

# 📦 Product APIs

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/products` | Authenticated Users |
| POST | `/api/products` | Manager Only |
| PUT | `/api/products/:id` | Manager Only |
| DELETE | `/api/products/:id` | Manager Only |

---

# 🎨 UI Highlights

- Luxury Jewelry Theme
- Elegant Modern Design
- Responsive Layout
- Smooth Framer Motion Animations
- Premium User Experience
- Beautiful Dashboard Interface

---

# 🔒 Security Features

- JWT Authentication
- Password Hashing using bcrypt
- Protected Routes
- Role-Based Authorization
- Secure API Access

---

# 🌐 Production Deployment

Deployment configurations are already included.

## Backend Deployment
- Render Blueprint: `render.yaml`

## Frontend Deployment
- Vercel Config: `client/vercel.json`

Detailed deployment guide available in:

```bash
DEPLOYMENT.md
```

---

# 📸 Future Enhancements

- Payment Gateway Integration
- Wishlist Feature
- Product Reviews & Ratings
- Coupon System
- Analytics Dashboard
- AI Recommendations
- Email Notifications

---

# 👨‍💻 Developer

Developed with ❤️ using the MERN Stack.

---

# ⭐ Support

If you like this project, give it a ⭐ on GitHub.

---

# 📜 License

This project is licensed under the MIT License.
