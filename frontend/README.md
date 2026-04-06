# Postman-Like Electron Frontend

A modern desktop application built with Electron, React, TypeScript, and Tailwind CSS for testing and managing API requests.

## Tech Stack

- **Electron** - Desktop application framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS
- **Zustand** - State management
- **React Query** - Data fetching and caching
- **Axios** - HTTP client

## Project Structure

```
frontend/
├── electron/              # Electron main process
│   ├── main.ts           # Main process entry
│   ├── preload.ts        # Preload script (security bridge)
│   └── ipc/              # IPC handlers
├── src/
│   ├── components/       # Reusable UI components
│   ├── features/         # Feature-based modules
│   │   ├── auth/
│   │   ├── workspace/
│   │   ├── collections/
│   │   ├── requests/
│   │   └── environments/
│   ├── pages/            # Page components
│   ├── layouts/          # Layout components
│   ├── store/            # Zustand stores
│   ├── services/         # API services
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript types
│   ├── App.tsx           # Root component
│   └── main.tsx          # React entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Getting Started

### Prerequisites

- Node.js v18 or higher
- npm or yarn
- Backend API running on http://localhost:5000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

This will:
- Start Vite dev server on http://localhost:5173
- Compile Electron TypeScript files
- Launch Electron app with hot reload

### Building for Production

Build the application:
```bash
npm run build
```

Build Electron distributable:
```bash
npm run build:electron
```

This will create installers in the `release/` directory.

## Features

### Implemented

- ✅ User authentication (login/register)
- ✅ Workspace management
- ✅ Collection organization
- ✅ Request configuration
- ✅ HTTP request execution
- ✅ Response viewing
- ✅ Environment variables
- ✅ Request history

### UI Components

- **Sidebar**: Workspace selector, collections tree
- **Request Editor**: URL bar, method selector, tabs for params/headers/body/auth
- **Response Viewer**: Status, timing, body, headers

## Security

The application follows Electron security best practices:

- ✅ Context isolation enabled
- ✅ Node integration disabled
- ✅ Preload script for secure IPC
- ✅ Content Security Policy
- ✅ No remote module usage

## State Management

### Zustand Stores

- **useAuthStore**: User authentication state
- **useWorkspaceStore**: Current workspace and workspace list
- **useRequestStore**: Active request and environment

### React Query

Used for server state management:
- Automatic caching
- Background refetching
- Optimistic updates
- Error handling

## API Integration

All API calls go through the centralized `api.ts` service:

```typescript
import api from '@/services/api';

// Automatically adds auth token
const response = await api.get('/workspaces');
```

## Development Tips

### Hot Reload

The app supports hot reload for both React and Electron:
- React changes: Instant hot reload
- Electron changes: Automatic restart

### DevTools

Press `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac) to open Chrome DevTools.

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:5000/api
```

## Scripts

- `npm run dev` - Start development mode
- `npm run dev:vite` - Start Vite dev server only
- `npm run dev:electron` - Start Electron only
- `npm run build` - Build for production
- `npm run build:electron` - Create distributable
- `npm run preview` - Preview production build

## Troubleshooting

### Electron won't start

Make sure the backend is running on http://localhost:5000

### TypeScript errors

Run type checking:
```bash
npx tsc --noEmit
```

### Build errors

Clear dist folders and rebuild:
```bash
rm -rf dist dist-electron
npm run build
```

## Contributing

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Follow React best practices
4. Test on multiple platforms

## License

ISC
