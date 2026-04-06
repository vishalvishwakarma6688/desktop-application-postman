🚀 Frontend (Electron.js) – MVP Architecture
🧠 Key Idea

Electron apps = 3 layers

Main Process → Node.js (app control, system access)
Renderer Process → React UI (your app)
Preload Script → Secure bridge (VERY IMPORTANT for production)
🧱 Tech Stack (Industry Standard)
Core
Electron
React (Vite ⚡ — you already use it)
TypeScript (recommended)
UI
Tailwind CSS (you already use)
ShadCN UI (optional but powerful)
State
Zustand (lightweight & scalable)
(Better than Redux for this use case)
API
Axios
Others
React Query (for caching requests like Postman)
UUID
Monaco Editor (for JSON body editing 🔥)
📁 Folder Structure (PRODUCTION LEVEL)
electron-app/
│
├── electron/                # Main process
│   ├── main.ts
│   ├── preload.ts
│   └── ipc/
│       └── handlers.ts
│
├── src/                     # Renderer (React)
│   ├── components/
│   ├── features/
│   │   ├── auth/
│   │   ├── workspace/
│   │   ├── collections/
│   │   ├── requests/
│   │   └── environments/
│   │
│   ├── pages/
│   ├── layouts/
│   ├── store/               # Zustand
│   ├── services/            # API calls
│   ├── hooks/
│   ├── utils/
│   ├── types/
│   └── App.tsx
│
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
⚙️ Electron Setup (Core Files)
🧠 main.ts (Main Process)
import { app, BrowserWindow } from "electron";
import path from "path";

let mainWindow: BrowserWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL("http://localhost:5173"); // Vite dev server
};

app.whenReady().then(createWindow);
🔐 preload.ts (Security Bridge)
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  send: (channel: string, data: any) => {
    ipcRenderer.send(channel, data);
  },
  receive: (channel: string, func: any) => {
    ipcRenderer.on(channel, (_, ...args) => func(...args));
  },
});

👉 This prevents security issues (industry standard)

🔗 API Layer (VERY IMPORTANT)
services/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
🧠 State Management (Zustand)
store/useAuthStore.ts
import { create } from "zustand";

interface AuthState {
  user: any;
  token: string | null;
  setAuth: (user: any, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,

  setAuth: (user, token) => {
    localStorage.setItem("token", token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null });
  },
}));
🔥 FEATURE MODULE STRUCTURE

Example: Requests

features/requests/
│
├── components/
│   ├── RequestEditor.tsx
│   ├── ResponseViewer.tsx
│   ├── HeadersTab.tsx
│   ├── BodyTab.tsx
│   └── ParamsTab.tsx
│
├── api.ts
├── hooks.ts
└── types.ts
🖥️ MVP UI STRUCTURE
Layout
-----------------------------------------
| Sidebar | Request Editor | Response   |
|         |                |            |
-----------------------------------------
🧩 Core Screens
1. Auth
Login
Register
2. Dashboard
Workspaces list
3. Main App Screen

Left Sidebar:

Workspaces
Collections
Requests

Center:

Request Builder
URL input
Method dropdown
Tabs:
Params
Headers
Body
Auth

Right:

Response Viewer
Status
JSON
Headers
Time
🔥 Request Execution Flow (Frontend)
User clicks Send
Call backend /requests/execute
Show response
Save history
Example API Call
import api from "@/services/api";

export const executeRequest = async (data: any) => {
  const res = await api.post("/requests/execute", data);
  return res.data;
};
🧠 React Query Integration (OPTIONAL BUT POWERFUL)
import { useMutation } from "@tanstack/react-query";
import { executeRequest } from "./api";

export const useExecuteRequest = () => {
  return useMutation({
    mutationFn: executeRequest,
  });
};
🎯 MVP FEATURES CHECKLIST

✅ Auth UI
✅ Workspace switcher
✅ Collection CRUD
✅ Request builder
✅ Execute API
✅ Response viewer
✅ Save history

⚠️ Important Industry Tips
🔐 Security
NEVER enable nodeIntegration: true
Always use preload.ts
⚡ Performance
Use React Query caching
Avoid re-rendering large JSON
🧠 UX
Auto-save request
Keyboard shortcuts (like Postman later)