# Quick Start Guide

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js v18+ installed (you have v22.17.0)
- ✅ MongoDB installed and running
- ✅ npm installed

## Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
The `.env` file is already created with default values. Update if needed:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/postman-like-app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 3. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# Windows (if installed as service)
net start MongoDB

# Or start manually
mongod
```

### 4. Start the Server
```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

You should see:
```
MongoDB Connected: localhost
Server running in development mode on port 5000
```

### 5. Test the API
Open a new terminal and test the health endpoint:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{"status":"OK","message":"Server is running"}
```

## First API Calls

### Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"password123\"}"
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
```

Save the token from the response and use it in subsequent requests:
```bash
export TOKEN="your_token_here"
```

### Create a Workspace
```bash
curl -X POST http://localhost:5000/api/workspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"name\":\"My First Workspace\"}"
```

## Project Structure

```
backend/
├── src/
│   ├── controllers/      # Request handlers
│   │   ├── authController.js
│   │   ├── workspaceController.js
│   │   ├── collectionController.js
│   │   ├── requestController.js
│   │   ├── environmentController.js
│   │   └── historyController.js
│   ├── models/           # Database schemas
│   │   ├── User.js
│   │   ├── Workspace.js
│   │   ├── Collection.js
│   │   ├── Request.js
│   │   ├── Environment.js
│   │   └── RequestHistory.js
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   │   ├── requestExecutor.js
│   │   └── variableSubstitution.js
│   ├── middlewares/      # Express middlewares
│   │   ├── auth.js
│   │   ├── workspaceAccess.js
│   │   └── errorHandler.js
│   ├── utils/            # Utilities
│   ├── config/           # Configuration
│   └── app.js            # Express setup
├── server.js             # Entry point
├── .env                  # Environment variables
├── package.json
├── README.md             # Full documentation
├── API_EXAMPLES.md       # API examples
└── QUICKSTART.md         # This file
```

## Available Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces` - Get all workspaces
- `GET /api/workspaces/:id` - Get workspace by ID
- `POST /api/workspaces/:id/members` - Add member
- `PUT /api/workspaces/:id` - Update workspace
- `DELETE /api/workspaces/:id` - Delete workspace

### Collections
- `POST /api/collections` - Create collection
- `GET /api/collections/workspace/:workspaceId` - Get collections
- `GET /api/collections/:id` - Get collection by ID
- `PUT /api/collections/:id` - Update collection
- `DELETE /api/collections/:id` - Delete collection

### Requests
- `POST /api/requests` - Create request
- `GET /api/requests/collection/:collectionId` - Get requests
- `GET /api/requests/:id` - Get request by ID
- `POST /api/requests/:id/execute` - Execute request
- `PUT /api/requests/:id` - Update request
- `PATCH /api/requests/:id/star` - Toggle star
- `DELETE /api/requests/:id` - Delete request

### Environments
- `POST /api/environments` - Create environment
- `GET /api/environments/workspace/:workspaceId` - Get environments
- `GET /api/environments/:id` - Get environment by ID
- `PUT /api/environments/:id` - Update environment
- `DELETE /api/environments/:id` - Delete environment

### History
- `GET /api/history` - Get request history
- `GET /api/history/:id` - Get history by ID
- `GET /api/history/request/:requestId` - Get history by request
- `DELETE /api/history/:id` - Delete history record
- `DELETE /api/history` - Clear all history

## Next Steps

1. Read the full [README.md](README.md) for detailed documentation
2. Check [API_EXAMPLES.md](API_EXAMPLES.md) for request/response examples
3. Start building your frontend application
4. Test all endpoints with your favorite API client

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check the connection string in `.env`

### Port Already in Use
- Change the PORT in `.env` to another port (e.g., 5001)

### JWT Token Errors
- Make sure you're including the token in the Authorization header
- Format: `Authorization: Bearer <your_token>`

## Support

For issues or questions, refer to the main README.md or check the code comments.
