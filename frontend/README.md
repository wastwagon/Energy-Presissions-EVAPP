# EV Charging Billing - Frontend
## React + TypeScript Dashboard

Frontend application for the EV Charging Billing System with multiple dashboards.

## Features

- ✅ React 18 with TypeScript
- ✅ Vite for fast development
- ✅ Material-UI for components
- ✅ React Router for navigation
- ✅ Redux Toolkit for state management
- ✅ Axios for API calls
- ✅ Multiple dashboards:
  - Operations Dashboard (`/ops`)
  - Admin Dashboard (`/admin`)
  - Customer Portal (`/`)
  - Public Station Finder (`/stations`)

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

- `VITE_API_URL` - API base URL (default: http://localhost/api)
- `VITE_WS_URL` - WebSocket URL (default: ws://localhost/ocpp)
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

- `/` - Home page / Customer portal
- `/stations` - Public station finder
- `/ops` - Operations dashboard
- `/ops/sessions` - Charging sessions list
- `/ops/devices` - Device inventory
- `/admin` - Admin dashboard

## Next Steps

- [ ] Implement authentication
- [ ] Connect to API endpoints
- [ ] Add real-time WebSocket updates
- [ ] Implement charge point list with live status
- [ ] Implement sessions table
- [ ] Add charts and analytics
- [ ] Implement station finder with map



