# API Request/Response Examples

This document provides detailed examples of API requests and responses for the Postman-like Backend API.

## Authentication Examples

### 1. Register User

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": null,
      "createdAt": "2026-04-04T21:00:00.000Z",
      "updatedAt": "2026-04-04T21:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Login

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": null,
      "createdAt": "2026-04-04T21:00:00.000Z",
      "updatedAt": "2026-04-04T21:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Workspace Examples

### 3. Create Workspace

**Request:**
```bash
curl -X POST http://localhost:5000/api/workspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "My API Project"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "My API Project",
    "owner": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "members": [],
    "createdAt": "2026-04-04T21:05:00.000Z",
    "updatedAt": "2026-04-04T21:05:00.000Z"
  }
}
```

### 4. Get All Workspaces

**Request:**
```bash
curl -X GET http://localhost:5000/api/workspaces \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200 OK):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "My API Project",
      "owner": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "members": [],
      "createdAt": "2026-04-04T21:05:00.000Z",
      "updatedAt": "2026-04-04T21:05:00.000Z"
    }
  ]
}
```

## Collection Examples

### 5. Create Collection

**Request:**
```bash
curl -X POST http://localhost:5000/api/collections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "User API Tests",
    "description": "Collection for testing user-related endpoints",
    "workspace": "507f1f77bcf86cd799439012"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "User API Tests",
    "description": "Collection for testing user-related endpoints",
    "workspace": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "My API Project"
    },
    "creator": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "createdAt": "2026-04-04T21:10:00.000Z",
    "updatedAt": "2026-04-04T21:10:00.000Z"
  }
}
```

## Request Examples

### 6. Create Request with Bearer Auth

**Request:**
```bash
curl -X POST http://localhost:5000/api/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "Get All Users",
    "collection": "507f1f77bcf86cd799439013",
    "workspace": "507f1f77bcf86cd799439012",
    "method": "GET",
    "url": "{{base_url}}/api/users",
    "headers": [
      {
        "key": "Content-Type",
        "value": "application/json",
        "enabled": true
      }
    ],
    "queryParams": [
      {
        "key": "page",
        "value": "1",
        "enabled": true
      },
      {
        "key": "limit",
        "value": "10",
        "enabled": true
      }
    ],
    "body": {
      "type": "none",
      "content": null
    },
    "auth": {
      "type": "bearer",
      "bearer": {
        "token": "{{api_token}}"
      }
    }
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Get All Users",
    "collection": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "User API Tests"
    },
    "workspace": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "My API Project"
    },
    "method": "GET",
    "url": "{{base_url}}/api/users",
    "headers": [
      {
        "key": "Content-Type",
        "value": "application/json",
        "enabled": true
      }
    ],
    "queryParams": [
      {
        "key": "page",
        "value": "1",
        "enabled": true
      },
      {
        "key": "limit",
        "value": "10",
        "enabled": true
      }
    ],
    "body": {
      "type": "none",
      "content": null
    },
    "auth": {
      "type": "bearer",
      "bearer": {
        "token": "{{api_token}}"
      }
    },
    "isStarred": false,
    "createdBy": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "createdAt": "2026-04-04T21:15:00.000Z",
    "updatedAt": "2026-04-04T21:15:00.000Z"
  }
}
```

### 7. Create POST Request with JSON Body

**Request:**
```bash
curl -X POST http://localhost:5000/api/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "Create User",
    "collection": "507f1f77bcf86cd799439013",
    "workspace": "507f1f77bcf86cd799439012",
    "method": "POST",
    "url": "{{base_url}}/api/users",
    "headers": [
      {
        "key": "Content-Type",
        "value": "application/json",
        "enabled": true
      }
    ],
    "queryParams": [],
    "body": {
      "type": "json",
      "content": {
        "name": "Jane Smith",
        "email": "jane@example.com",
        "role": "user"
      }
    },
    "auth": {
      "type": "bearer",
      "bearer": {
        "token": "{{api_token}}"
      }
    }
  }'
```

## Environment Examples

### 8. Create Environment

**Request:**
```bash
curl -X POST http://localhost:5000/api/environments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "Production",
    "workspace": "507f1f77bcf86cd799439012",
    "variables": [
      {
        "key": "base_url",
        "value": "https://api.production.com",
        "enabled": true
      },
      {
        "key": "api_token",
        "value": "prod_token_12345",
        "enabled": true
      },
      {
        "key": "timeout",
        "value": "5000",
        "enabled": true
      }
    ]
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "name": "Production",
    "workspace": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "My API Project"
    },
    "variables": [
      {
        "key": "base_url",
        "value": "https://api.production.com",
        "enabled": true
      },
      {
        "key": "api_token",
        "value": "prod_token_12345",
        "enabled": true
      },
      {
        "key": "timeout",
        "value": "5000",
        "enabled": true
      }
    ],
    "createdBy": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "createdAt": "2026-04-04T21:20:00.000Z",
    "updatedAt": "2026-04-04T21:20:00.000Z"
  }
}
```

## Request Execution Examples

### 9. Execute Request

**Request:**
```bash
curl -X POST http://localhost:5000/api/requests/507f1f77bcf86cd799439014/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "environmentId": "507f1f77bcf86cd799439015"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "historyId": "507f1f77bcf86cd799439016",
    "result": {
      "status": 200,
      "statusText": "OK",
      "data": {
        "users": [
          {
            "id": 1,
            "name": "User 1",
            "email": "user1@example.com"
          },
          {
            "id": 2,
            "name": "User 2",
            "email": "user2@example.com"
          }
        ],
        "page": 1,
        "total": 50
      },
      "headers": {
        "content-type": "application/json",
        "content-length": "234"
      },
      "executionTime": 245,
      "error": null
    }
  }
}
```

## History Examples

### 10. Get Request History

**Request:**
```bash
curl -X GET "http://localhost:5000/api/history?limit=10&skip=0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200 OK):**
```json
{
  "success": true,
  "count": 10,
  "total": 45,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439016",
      "user": "507f1f77bcf86cd799439011",
      "request": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Get All Users",
        "method": "GET",
        "url": "{{base_url}}/api/users"
      },
      "workspace": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "My API Project"
      },
      "requestSnapshot": {
        "method": "GET",
        "url": "{{base_url}}/api/users",
        "headers": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "type": "none",
          "content": null
        }
      },
      "response": {
        "status": 200,
        "statusText": "OK",
        "data": {
          "users": [],
          "page": 1,
          "total": 50
        },
        "headers": {
          "content-type": "application/json"
        },
        "executionTime": 245
      },
      "error": null,
      "executedAt": "2026-04-04T21:25:00.000Z"
    }
  ]
}
```

## Error Response Examples

### 11. Validation Error (400)

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John",
    "email": "invalid-email"
  }'
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "type": "ValidationError",
    "details": [
      {
        "msg": "Please provide a valid email",
        "param": "email",
        "location": "body"
      },
      {
        "msg": "Password is required",
        "param": "password",
        "location": "body"
      }
    ]
  }
}
```

### 12. Authentication Error (401)

**Request:**
```bash
curl -X GET http://localhost:5000/api/workspaces \
  -H "Authorization: Bearer invalid_token"
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "message": "Invalid token",
    "type": "AuthenticationError",
    "details": {}
  }
}
```

### 13. Authorization Error (403)

**Request:**
```bash
curl -X DELETE http://localhost:5000/api/workspaces/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (403 Forbidden):**
```json
{
  "success": false,
  "error": {
    "message": "Only workspace owner can delete workspace",
    "type": "AuthorizationError",
    "details": {}
  }
}
```

### 14. Not Found Error (404)

**Request:**
```bash
curl -X GET http://localhost:5000/api/requests/invalid_id \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "message": "Request not found",
    "type": "NotFoundError",
    "details": {}
  }
}
```

## Using Environment Variables

Environment variables can be used in:
- URLs: `{{base_url}}/api/users`
- Headers: `Authorization: Bearer {{api_token}}`
- Query parameters: `?key={{api_key}}`
- Request body: `{ "token": "{{auth_token}}" }`

Variables are replaced with their actual values from the selected environment during request execution.
