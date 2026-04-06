# Postman-like Backend API

A powerful backend API for a Postman-like application that enables users to create, organize, and execute HTTP requests with support for workspaces, collections, environments, and request history.

## Features

- 🔐 JWT-based authentication
- 👥 Workspace management with role-based access control
- 📂 Collections for organizing requests
- 🌐 HTTP request execution with full configuration support
- 🔧 Environment variables for dynamic request configuration
- 📜 Request history tracking
- ⭐ Starred/favorite requests
- 🔑 Multiple authentication types (Bearer, Basic, API Key)

## Tech Stack

- Node.js + Express.js
- MongoDB + Mongoose
- JWT for authentication
- Axios for HTTP request execution
- bcrypt for password hashing

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd backend
```

2. Install dependencies
```bash
npm install
```

3. Create environment file
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/postman-like-app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

5. Start MongoDB (if running locally)
```bash
mongod
```

6. Start the server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Workspaces

#### Create Workspace
```http
POST /api/workspaces
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Workspace"
}
```

#### Get All Workspaces
```http
GET /api/workspaces
Authorization: Bearer <token>
```

#### Get Workspace by ID
```http
GET /api/workspaces/:id
Authorization: Bearer <token>
```

#### Add Member to Workspace
```http
POST /api/workspaces/:id/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user_id_here",
  "role": "editor"
}
```

### Collections

#### Create Collection
```http
POST /api/collections
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "API Tests",
  "description": "Collection of API test requests",
  "workspace": "workspace_id_here"
}
```

#### Get Collections by Workspace
```http
GET /api/collections/workspace/:workspaceId
Authorization: Bearer <token>
```

### Requests

#### Create Request
```http
POST /api/requests
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Get Users",
  "collection": "collection_id_here",
  "workspace": "workspace_id_here",
  "method": "GET",
  "url": "https://api.example.com/users",
  "headers": [
    { "key": "Content-Type", "value": "application/json", "enabled": true }
  ],
  "queryParams": [
    { "key": "page", "value": "1", "enabled": true }
  ],
  "body": {
    "type": "json",
    "content": {}
  },
  "auth": {
    "type": "bearer",
    "bearer": {
      "token": "{{api_token}}"
    }
  }
}
```

#### Get Requests by Collection
```http
GET /api/requests/collection/:collectionId
Authorization: Bearer <token>
```

#### Execute Request
```http
POST /api/requests/:id/execute
Authorization: Bearer <token>
Content-Type: application/json

{
  "environmentId": "environment_id_here"
}
```

#### Toggle Star on Request
```http
PATCH /api/requests/:id/star
Authorization: Bearer <token>
```

### Environments

#### Create Environment
```http
POST /api/environments
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Production",
  "workspace": "workspace_id_here",
  "variables": [
    { "key": "base_url", "value": "https://api.example.com", "enabled": true },
    { "key": "api_token", "value": "your_token_here", "enabled": true }
  ]
}
```

#### Get Environments by Workspace
```http
GET /api/environments/workspace/:workspaceId
Authorization: Bearer <token>
```

### History

#### Get Request History
```http
GET /api/history?limit=50&skip=0
Authorization: Bearer <token>
```

#### Get History by ID
```http
GET /api/history/:id
Authorization: Bearer <token>
```

#### Get History by Request
```http
GET /api/history/request/:requestId
Authorization: Bearer <token>
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Error Responses

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "message": "Error message here",
    "type": "ErrorType",
    "details": {}
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized / Authentication Error
- `403` - Forbidden / Authorization Error
- `404` - Not Found
- `500` - Internal Server Error

## Environment Variables

Environment variables can be used in requests using the `{{variable_name}}` syntax. They will be replaced with actual values during request execution.

Example:
```
URL: {{base_url}}/users
Header: Authorization: Bearer {{api_token}}
```

## Role-Based Access Control

Workspaces support role-based access control with the following roles:

- **Owner**: Full access, can delete workspace and manage all members
- **Admin**: Can manage members and modify workspace resources
- **Editor**: Can create, edit, and delete collections and requests
- **Viewer**: Read-only access

## Project Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routes
│   ├── services/        # Business logic
│   ├── middlewares/     # Express middlewares
│   ├── utils/           # Utility functions
│   ├── config/          # Configuration files
│   └── app.js           # Express app setup
├── server.js            # Entry point
├── .env                 # Environment variables
├── .env.example         # Environment template
└── package.json
```

## License

ISC
