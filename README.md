## Travel Planner

Plan trips, explore destinations, and save places you want to visit. You can browse and save without logging in; creating trips and sharing requires sign-in.

### What’s inside
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + MongoDB (Mongoose)
- **Auth**: JWT (used for protected features like trips/sharing)

### Features
- **Explore**: discover places
- **Want to go**: save places without an account
- **Trips**: create and manage trip plans (requires login)

---

### Prerequisites
- Node.js (use NVM; LTS recommended)
- MongoDB running locally (or MongoDB Atlas)

If running locally, MongoDB default URL is:
```
mongodb://localhost:27017
```

---

### Quick start (development)
Open two terminals, one for backend and one for frontend.

Backend:
```bash
cd backend
npm install
# Set env vars (create .env):
# MONGODB_URI=mongodb://localhost:27017/travel-planner
# PORT=5000
npm run dev
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Then open the URL shown by Vite (e.g. `http://localhost:5173` or `5174/5175`).

---

### Useful scripts
Backend (`travel-planner/backend/package.json`):
- `npm run dev`: start the API in dev mode (ts-node)
- `npm run seed`: seed example places data
- `npm run generate-types`: generate shared API types for the frontend

Frontend (`travel-planner/frontend/package.json`):
- `npm run dev`: start the web app with Vite
- `npm run build`: type-check then build production assets
- `npm run preview`: preview the production build locally
- `npm run generate-types`: run the backend types generator from the frontend

---

### Environment variables (backend)
Create `backend/.env` with at least:
```
MONGODB_URI=mongodb://localhost:27017/travel-planner
PORT=5000
# JWT_SECRET=your-secret-here
```
Use a strong `JWT_SECRET` in real deployments.

---

### Project structure
```
travel-planner/
├── backend/              # Express API (TypeScript)
├── frontend/             # React app (TypeScript + Vite + Tailwind)
└── .gitignore            # Common ignores for node_modules, builds, env files
```

---

### Troubleshooting
- **Port already in use**: Vite will try another port automatically; for the backend, free port 5000 or change `PORT` in `.env`.
- **Tailwind classes not applying**: ensure these exist in `frontend`:
  - `postcss.config.js` with `tailwindcss` and `autoprefixer` plugins
  - `tailwind.config.js` with `content` pointing to `./index.html` and `./src/**/*.{js,ts,jsx,tsx}`
  - `src/index.css` starts with `@tailwind base; @tailwind components; @tailwind utilities;`
  - restart `npm run dev` after changes.
- **MongoDB connection errors**: confirm MongoDB is running and `MONGODB_URI` is correct.

---

### Roadmap (high level)
- User auth UI and sharing flows
- Trip editing and collaboration
- Images and richer place details

Questions or ideas? Open an issue or start a discussion in your repo.
