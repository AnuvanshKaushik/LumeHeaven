# LUMEHEAVEN

A full-stack MERN web application with role-based authentication:
- Customer role: register/login and browse products
- Manager role: secure login and full product CRUD

## Tech Stack
- Frontend: React + Vite + React Router + Framer Motion + React Hot Toast
- Backend: Node.js + Express + MongoDB + Mongoose + JWT

## Project Structure
- `client/` React frontend
- `server/` Express API

## Backend Setup
1. `cd server`
2. `cp .env.example .env` (or create `.env` manually)
3. Update values in `.env`
4. `npm install`
5. `npm run dev`

Default manager credentials are seeded automatically from env values:
- Email: `manager@lumeheaven.com`
- Password: `Manager@123`

## Frontend Setup
1. `cd client`
2. `cp .env.example .env`
3. `npm install`
4. `npm run dev`

Frontend runs on `http://localhost:5173` and backend on `http://localhost:5000`.

## Production Deployment
Use the deployment runbook in [DEPLOYMENT.md](./DEPLOYMENT.md).
- Backend blueprint for Render is included as `render.yaml`.
- Frontend Vercel config is included as `client/vercel.json`.

## API Summary
- `POST /api/auth/register` customer registration
- `POST /api/auth/login` role-based login (`customer` or `manager`)
- `GET /api/auth/me` authenticated profile
- `GET /api/products` authenticated product list
- `POST /api/products` manager only
- `PUT /api/products/:id` manager only
- `DELETE /api/products/:id` manager only
