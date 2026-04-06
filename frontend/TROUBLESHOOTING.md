# Troubleshooting Guide

## Common Issues and Solutions

### 1. Electron App Not Opening

**Issue**: TypeScript compilation errors or module resolution issues

**Solution**: 
- Make sure `tsconfig.electron.json` is properly configured
- Ensure `electron-package.json` exists and is copied to `dist-electron/`
- Check that the backend is running on http://localhost:5000

### 2. Tailwind CSS Not Working

**Issue**: PostCSS plugin errors

**Solution**:
- Tailwind CSS v3 is installed (not v4)
- `postcss.config.js` uses `tailwindcss` (not `@tailwindcss/postcss`)
- Run `npm install` to ensure all dependencies are installed

### 3. "exports is not defined" Error

**Issue**: Module type mismatch between package.json and compiled code

**Solution**:
- The `electron-package.json` file sets `"type": "commonjs"` for the Electron process
- This file is automatically copied to `dist-electron/package.json` during build
- If missing, run: `npm run build:electron-only`

### 4. Backend Connection Errors

**Issue**: Cannot connect to API

**Solution**:
1. Start the backend first:
   ```bash
   cd backend
   npm run dev
   ```
2. Verify it's running on http://localhost:5000
3. Test with: `curl http://localhost:5000/health`

### 5. DevTools Console Errors

**Issue**: Autofill errors in console

**Solution**:
- These are harmless warnings from Electron DevTools
- They don't affect functionality
- Can be safely ignored

### 6. Hot Reload Not Working

**Issue**: Changes not reflecting

**Solution**:
- For React changes: Should auto-reload
- For Electron changes: Restart the app (Ctrl+R or Cmd+R)
- If stuck, stop and restart: `npm run dev`

## Development Workflow

### Starting the App

1. **Start Backend** (Terminal 1):
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Wait for**:
   - Vite server: http://localhost:5173
   - Electron window to open automatically

### Making Changes

- **React/UI changes**: Save file → Auto hot-reload
- **Electron main process**: Save file → Restart app (Ctrl+R)
- **API changes**: Backend auto-restarts with nodemon

### Debugging

1. **React DevTools**: Already open in Electron window
2. **Console logs**: Check both:
   - Electron DevTools (for renderer process)
   - Terminal (for main process)
3. **Network requests**: DevTools Network tab

## Clean Start

If things are really broken:

```bash
# Stop all processes
# Then:

cd frontend
rm -rf node_modules dist dist-electron
npm install
npm run dev
```

## Port Conflicts

If port 5173 is in use:

1. Change in `vite.config.ts`:
   ```typescript
   server: {
     port: 5174, // or any other port
   }
   ```

2. Update `electron/main.ts`:
   ```typescript
   mainWindow.loadURL('http://localhost:5174');
   ```

## Build Issues

If production build fails:

```bash
# Clean build
npm run build

# If successful, create distributable
npm run build:electron
```

## Getting Help

1. Check console for error messages
2. Verify all dependencies are installed
3. Ensure Node.js version is 18+
4. Check that MongoDB is running (for backend)

## Success Indicators

You know it's working when you see:

1. ✅ Vite server running on http://localhost:5173
2. ✅ TypeScript compilation successful
3. ✅ Electron window opens
4. ✅ Login page displays
5. ✅ Can register/login successfully
