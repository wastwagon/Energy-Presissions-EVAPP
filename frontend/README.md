# EV Charging Billing - Frontend
## React + TypeScript Dashboard

Frontend application for the EV Charging Billing System with role-based dashboards.

## Features

- ✅ React 18 with TypeScript
- ✅ Vite for fast development
- ✅ Material-UI for components
- ✅ React Router for navigation
- ✅ Redux Toolkit for state management
- ✅ Axios for API calls
- ✅ Multiple role dashboards and customer flows:
  - Customer experience (`/user/*`, station finder at `/stations`)
  - Admin dashboard (`/admin/*`)
  - Super Admin dashboard (`/superadmin/*`)

## Project Structure

```
frontend/
├── src/
│   ├── components/        # Reusable components
│   ├── pages/            # Page components
│   │   ├── admin/        # Admin pages
│   │   └── ops/          # Operations pages
│   ├── layouts/          # Layout components
│   ├── store/            # Redux store
│   ├── services/         # API services
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
├── Dockerfile.dev
└── README.md
```

## Environment Variables

- `VITE_API_URL` - API base URL (default: same-origin `/api`)
- `VITE_WS_URL` - Optional Socket.IO URL override (default: same-origin `/ws`)
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth Client ID for "Login with Google" (optional)

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Available Routes

- `/` - Home page
- `/stations` - Public station finder
- `/user/*` - Customer dashboard and charging flows
- `/admin/*` - Admin operations
- `/superadmin/*` - Super Admin operations



