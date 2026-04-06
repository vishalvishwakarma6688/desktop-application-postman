# Design Document: Postman-like Backend API

## Overview

This design document outlines the architecture and implementation details for a Postman-like backend API application. The system enables users to create, organize, and execute HTTP requests with support for workspaces, collections, environments, and request history. The application follows a RESTful API design pattern with JWT-based authentication and MongoDB for data persistence.

The core functionality revolves around the Request Executor service, which processes HTTP requests with environment variable substitution, multiple authentication methods, and comprehensive response tracking.

## Architecture

### System Architecture

The application follows a layered architecture pattern:

```
┌─────────────────────────────────────────┐
│         Client Applications             │
└─────────────────┬───────────────────────┘
                  │ HTTP/REST
┌─────────────────▼───────────────────────┐
│         Express API Layer               │
│  ┌─────────────────────────────────┐   │
│  │   Authentication Middleware     │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │         Route Handlers          │   │
│  └─────────────────────────────────┘   │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Service Layer                   │
│  ┌──────────────┐  ┌─────────────────┐ │
│  │   Request    │  │   Environment   │ │
│  │   Executor   │  │   Variable      │ │
│  │   Service    │  │   Substitution  │ │
│  └──────────────┘  └─────────────────┘ │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Data Access Layer               │
│         (Mongoose Models)               │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         MongoDB Database                │
└─────────────────────────────────────────┘
```

### Technology Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken library)
- **HTTP Client**: Axios (for request execution)
- **Password Hashing**: bcrypt
- **Validation**: express-validator
- **Environment**: dotenv

### Project Structure

```
backend/
├── src/
│   ├── controllers/        # Request handlers
│   │   ├── authController.js
│   │   ├── workspaceController.js
│   │   ├── collectionController.js
│   │   ├── requestController.js
│   │   ├── environmentController.js
│   │   └── historyController.js
│   ├── models/            # Mongoose schemas
│   │   ├── User.js
│   │   ├── Workspace.js
│   │   ├── Collection.js
│   │   ├── Request.js
│   │   ├── Environment.js
│   │   └── RequestHistory.js
│   ├── routes/            # Express routes
│   │   ├── auth.js
│   │   ├── workspaces.js
│   │   ├── collections.js
│   │   ├── requests.js
│   │   ├── environments.js
│   │   └── history.js
│   ├── services/          # Business logic
│   │   ├── requestExecutor.js
│   │   └── variableSubstitution.js
│   ├── middlewares/       # Express middlewares
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── utils/             # Utility functions
│   │   └── validators.js
│   ├── config/            # Configuration
│   │   └── database.js
│   └── app.js             # Express app setup
├── server.js              # Entry point
├── .env                   # Environment variables
├── .env.example           # Environment template
├── package.json
└── README.md
```

## Components and Interfaces

### 1. Authentication System

**JWT Token Structure:**
```javascript
{
  userId: ObjectId,
  email: string,
  iat: timestamp,
  exp: timestamp
}
```

**Authentication Middleware:**
- Extracts JWT token from Authorization header (Bearer scheme)
- Verifies token signature and expiration
- Attaches decoded user information to request object
- Returns 401 for invalid/missing tokens

### 2. Request Executor Service

The Request Executor is the core service that executes HTTP requests with full configuration support.

**Interface:**
```javascript
async function executeRequest(requestConfig, environmentVariables) {
  // Returns: { status, data, headers, executionTime, error }
}
```

**Request Configuration Object:**
```javascript
{
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  headers: [{ key: string, value: string }],
  queryParams: [{ key: string, value: string }],
  body: {
    type: 'json' | 'form-data' | 'raw',
    content: any
  },
  auth: {
    type: 'bearer' | 'basic' | 'apikey' | 'none',
    bearer: { token: string },
    basic: { username: string, password: string },
    apikey: { key: string, value: string, addTo: 'header' | 'query' }
  }
}
```

**Execution Flow:**
1. Apply variable substitution to all string fields
2. Build Axios request configuration
3. Apply authentication based on auth type
4. Record start time
5. Execute HTTP request
6. Record end time and calculate duration
7. Return response with metadata

### 3. Variable Substitution Service

Replaces environment variable placeholders with actual values.

**Interface:**
```javascript
function substituteVariables(text, variables) {
  // Returns: string with {{variableName}} replaced
}
```

**Placeholder Format:** `{{variableName}}`

**Substitution Rules:**
- Case-sensitive variable names
- Undefined variables remain as placeholders
- Supports nested object traversal (e.g., `{{auth.token}}`)

### 4. Authorization Service

**Workspace Access Control:**
```javascript
function checkWorkspaceAccess(user, workspace, requiredRole) {
  // Returns: boolean
  // Roles hierarchy: owner > admin > editor > viewer
}
```

**Role Permissions:**
- **Owner**: Full access, can delete workspace, manage all members
- **Admin**: Can manage members, create/edit/delete collections and requests
- **Editor**: Can create/edit/delete collections and requests
- **Viewer**: Read-only access

## Data Models

### User Model

```javascript
{
  _id: ObjectId,
  name: String (required, trim),
  email: String (required, unique, lowercase, trim),
  password: String (required, hashed with bcrypt),
  avatar: String (optional, URL),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `email`: unique index for fast lookup

### Workspace Model

```javascript
{
  _id: ObjectId,
  name: String (required, trim),
  owner: ObjectId (ref: 'User', required),
  members: [{
    user: ObjectId (ref: 'User'),
    role: String (enum: ['admin', 'editor', 'viewer'])
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `owner`: index for owner queries
- `members.user`: index for member queries

### Collection Model

```javascript
{
  _id: ObjectId,
  name: String (required, trim),
  description: String (optional),
  workspace: ObjectId (ref: 'Workspace', required),
  creator: ObjectId (ref: 'User', required),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `workspace`: index for workspace queries
- Compound index: `(workspace, name)` for unique collection names per workspace

### Request Model

```javascript
{
  _id: ObjectId,
  name: String (required, trim),
  collection: ObjectId (ref: 'Collection', required),
  workspace: ObjectId (ref: 'Workspace', required),
  method: String (enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], required),
  url: String (required),
  headers: [{
    key: String,
    value: String,
    enabled: Boolean (default: true)
  }],
  queryParams: [{
    key: String,
    value: String,
    enabled: Boolean (default: true)
  }],
  body: {
    type: String (enum: ['json', 'form-data', 'raw', 'none']),
    content: Mixed
  },
  auth: {
    type: String (enum: ['bearer', 'basic', 'apikey', 'none']),
    bearer: {
      token: String
    },
    basic: {
      username: String,
      password: String
    },
    apikey: {
      key: String,
      value: String,
      addTo: String (enum: ['header', 'query'])
    }
  },
  isStarred: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `collection`: index for collection queries
- `workspace`: index for workspace queries
- Compound index: `(workspace, isStarred)` for starred requests

### Environment Model

```javascript
{
  _id: ObjectId,
  name: String (required, trim),
  workspace: ObjectId (ref: 'Workspace', required),
  variables: [{
    key: String (required),
    value: String (required),
    enabled: Boolean (default: true)
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `workspace`: index for workspace queries
- Compound index: `(workspace, name)` for unique environment names per workspace

### RequestHistory Model

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'User', required),
  request: ObjectId (ref: 'Request', required),
  workspace: ObjectId (ref: 'Workspace', required),
  requestSnapshot: {
    method: String,
    url: String,
    headers: Mixed,
    body: Mixed
  },
  response: {
    status: Number,
    statusText: String,
    data: Mixed,
    headers: Mixed,
    executionTime: Number (milliseconds)
  },
  error: {
    message: String,
    code: String
  },
  executedAt: Date (default: Date.now)
}
```

**Indexes:**
- `user`: index for user queries
- `request`: index for request queries
- Compound index: `(user, executedAt)` for user history sorted by time


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Authentication Properties

**Property 1: Password Hashing Invariant**
*For any* user registration with valid data, the stored password in the database should never equal the plaintext password provided during registration.
**Validates: Requirements 1.1, 1.5**

**Property 2: Valid Login Returns Valid JWT**
*For any* registered user with correct credentials, logging in should return a JWT token that can be successfully decoded and contains the user's ID and email.
**Validates: Requirements 1.2**

**Property 3: Invalid Credentials Rejection**
*For any* login attempt with invalid credentials (wrong password, non-existent email, or malformed data), the system should reject the attempt with a 401 authentication error.
**Validates: Requirements 1.3**

**Property 4: JWT Token Authentication**
*For any* protected endpoint and valid JWT token, including the token in the Authorization header should grant access, while invalid or missing tokens should result in 401 errors.
**Validates: Requirements 1.4**

### Workspace Properties

**Property 5: Workspace Creation Sets Owner**
*For any* workspace creation request, the created workspace should have the requesting user set as the owner.
**Validates: Requirements 2.1**

**Property 6: Workspace Query Completeness**
*For any* user, querying their workspaces should return exactly the set of workspaces where they are either the owner or a member, and no others.
**Validates: Requirements 2.2**

**Property 7: Member Role Assignment**
*For any* workspace member addition with a specified role (admin, editor, or viewer), the member should be stored with exactly that role.
**Validates: Requirements 2.3**

**Property 8: Workspace Data Completeness**
*For any* created workspace, the stored document should contain all required fields: name, owner, members array, createdAt, and updatedAt timestamps.
**Validates: Requirements 2.4**

**Property 9: Workspace Access Control**
*For any* workspace resource access attempt (collections, requests, environments), users who are not members of the workspace should be rejected with a 403 authorization error.
**Validates: Requirements 2.5, 3.4, 5.4, 8.1**

**Property 10: Role-Based Permission Hierarchy**
*For any* workspace modification operation, the system should enforce the role hierarchy: owners can perform all operations, admins can modify workspace settings and resources, editors can modify resources but not settings, and viewers should be rejected for any modification attempts.
**Validates: Requirements 8.2, 8.3, 8.4, 8.5**

### Collection Properties

**Property 11: Collection Creation References**
*For any* collection creation in a workspace, the created collection should have correct references to both the workspace and the creator user.
**Validates: Requirements 3.1**

**Property 12: Collection Query Correctness**
*For any* workspace, querying collections should return exactly all collections belonging to that workspace and no collections from other workspaces.
**Validates: Requirements 3.2**

**Property 13: Collection Data Completeness**
*For any* created collection, the stored document should contain all required fields: name, workspace reference, creator reference, createdAt, and updatedAt timestamps.
**Validates: Requirements 3.3**

### Request Properties

**Property 14: Request Configuration Storage**
*For any* request creation with configuration (method, URL, headers, query params, body, auth), all configuration fields should be stored correctly and retrievable.
**Validates: Requirements 4.1, 4.7**

**Property 15: Request Query Correctness**
*For any* collection, querying requests should return exactly all requests belonging to that collection and no requests from other collections.
**Validates: Requirements 4.5**

**Property 16: Request Starring**
*For any* request, when a user stars it, the isStarred field should be set to true, and when unstarred, it should be set to false.
**Validates: Requirements 4.6**

### Environment Properties

**Property 17: Environment Variable Storage**
*For any* environment creation with key-value variable pairs, all variables should be stored correctly with their keys, values, and enabled status.
**Validates: Requirements 5.1, 5.3**

**Property 18: Environment Query Correctness**
*For any* workspace, querying environments should return exactly all environments belonging to that workspace and no environments from other workspaces.
**Validates: Requirements 5.2**

### Request Execution Properties

**Property 19: Request Execution Configuration Application**
*For any* request execution against a mock HTTP server, the received request at the server should match the configured method, URL path, headers, query parameters, and body.
**Validates: Requirements 6.1**

**Property 20: Variable Substitution Correctness**
*For any* request containing variable placeholders ({{variableName}}) and an environment with those variables, executing the request should replace all placeholders with their corresponding values from the environment.
**Validates: Requirements 6.2**

**Property 21: Execution Timing Invariant**
*For any* request execution, the recorded end time should be greater than or equal to the start time, and the execution time should equal the difference between them.
**Validates: Requirements 6.3**

**Property 22: Response Data Capture**
*For any* successful request execution, the response should contain status code, response data, response headers, and execution time in milliseconds.
**Validates: Requirements 6.4**

**Property 23: Error Capture on Failure**
*For any* request execution that fails (network error, timeout, invalid URL), the system should capture error details including error message and error code, and return them without throwing an unhandled exception.
**Validates: Requirements 6.5, 10.6**

**Property 24: Authentication Header Construction**
*For any* request with authentication configured:
- Bearer auth should add header "Authorization: Bearer {token}"
- Basic auth should add header "Authorization: Basic {base64(username:password)}"
- API key auth should add the key to headers or query params as configured
**Validates: Requirements 6.6, 6.7, 6.8**

### Request History Properties

**Property 25: History Record Creation**
*For any* request execution, a history record should be created containing user reference, request reference, workspace reference, request snapshot, response data, and executedAt timestamp.
**Validates: Requirements 7.1, 7.4**

**Property 26: History Response Completeness**
*For any* created history record from a successful execution, it should contain response status, statusText, data, headers, and executionTime.
**Validates: Requirements 7.2**

**Property 27: History Query Correctness**
*For any* user, querying their history should return exactly all history records where they are the user, sorted by executedAt in descending order.
**Validates: Requirements 7.3**

### Validation Properties

**Property 28: Registration Data Validation**
*For any* registration attempt with invalid data (malformed email, weak password, missing required fields), the system should reject it with a 400 status code and descriptive validation errors.
**Validates: Requirements 9.1, 9.5**

**Property 29: HTTP Method Validation**
*For any* request creation with an HTTP method not in the set {GET, POST, PUT, DELETE, PATCH}, the system should reject it with a 400 validation error.
**Validates: Requirements 9.2**

**Property 30: URL Format Validation**
*For any* request creation with an invalid URL format (missing protocol, malformed structure), the system should reject it with a 400 validation error.
**Validates: Requirements 9.3**

**Property 31: Environment Variable Validation**
*For any* environment creation with invalid variable configuration (empty keys, duplicate keys), the system should reject it with a 400 validation error and descriptive error message.
**Validates: Requirements 9.4, 9.5**

### Error Handling Properties

**Property 32: HTTP Error Response Format**
*For any* error condition (authentication, authorization, not found, validation, server error), the system should return the appropriate HTTP status code (401, 403, 404, 400, 500) with a consistent error response structure containing error message and error type.
**Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

## Error Handling

### Error Response Structure

All errors follow a consistent JSON structure:

```javascript
{
  success: false,
  error: {
    message: string,      // Human-readable error message
    type: string,         // Error type: 'AuthenticationError', 'ValidationError', etc.
    details: object       // Optional additional details (e.g., validation errors)
  }
}
```

### Error Categories

**Authentication Errors (401):**
- Invalid or expired JWT token
- Missing authentication token
- Invalid login credentials

**Authorization Errors (403):**
- Insufficient permissions for operation
- Not a member of workspace
- Role does not permit action

**Validation Errors (400):**
- Invalid input format
- Missing required fields
- Constraint violations
- Invalid HTTP method or URL format

**Not Found Errors (404):**
- Resource does not exist
- Invalid resource ID

**Server Errors (500):**
- Database connection failures
- Unexpected exceptions
- External service failures

### Error Handling Middleware

A centralized error handling middleware catches all errors and formats them consistently:

```javascript
function errorHandler(err, req, res, next) {
  // Log error for debugging
  console.error(err);
  
  // Determine status code and error type
  const statusCode = err.statusCode || 500;
  const errorType = err.name || 'ServerError';
  
  // Send formatted error response
  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message,
      type: errorType,
      details: err.details || {}
    }
  });
}
```

### Request Execution Error Handling

Request execution errors are captured and returned without throwing:

```javascript
try {
  const response = await axios(config);
  return { status: response.status, data: response.data, ... };
} catch (error) {
  return {
    error: {
      message: error.message,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    }
  };
}
```

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests as complementary approaches:

**Unit Tests:**
- Verify specific examples and edge cases
- Test integration points between components
- Validate error conditions with specific inputs
- Test middleware behavior with known scenarios

**Property-Based Tests:**
- Verify universal properties across randomized inputs
- Test invariants that must hold for all valid data
- Validate business rules across the input space
- Ensure correctness properties from the design document

### Property-Based Testing Configuration

**Library Selection:** fast-check (for Node.js/JavaScript)

**Test Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `// Feature: postman-like-api, Property N: [property description]`

**Example Property Test Structure:**

```javascript
const fc = require('fast-check');

describe('Property 1: Password Hashing Invariant', () => {
  // Feature: postman-like-api, Property 1: Password never stored in plaintext
  it('should never store passwords in plaintext', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 100 })
        }),
        async (userData) => {
          const user = await User.create(userData);
          const storedUser = await User.findById(user._id);
          
          // Password should be hashed, not plaintext
          expect(storedUser.password).not.toBe(userData.password);
          expect(storedUser.password).toMatch(/^\$2[aby]\$/); // bcrypt format
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Testing Scope

**Unit Test Focus:**
- Authentication middleware with specific tokens
- Variable substitution with known patterns
- Error handler with specific error types
- Validation functions with edge cases
- Database model methods

**Property Test Focus:**
- All 32 correctness properties from design document
- Each property maps to specific requirements
- Comprehensive input coverage through randomization
- Invariant validation across all operations

### Test Organization

```
tests/
├── unit/
│   ├── middlewares/
│   │   ├── auth.test.js
│   │   └── errorHandler.test.js
│   ├── services/
│   │   ├── requestExecutor.test.js
│   │   └── variableSubstitution.test.js
│   └── utils/
│       └── validators.test.js
├── property/
│   ├── authentication.property.test.js
│   ├── workspace.property.test.js
│   ├── collection.property.test.js
│   ├── request.property.test.js
│   ├── environment.property.test.js
│   ├── execution.property.test.js
│   ├── history.property.test.js
│   ├── validation.property.test.js
│   └── errorHandling.property.test.js
└── integration/
    ├── auth.integration.test.js
    ├── workspace.integration.test.js
    └── requestExecution.integration.test.js
```

### Mock Server for Request Execution Tests

Property tests for request execution require a mock HTTP server:

```javascript
const express = require('express');
const mockServer = express();

mockServer.all('*', (req, res) => {
  // Echo back request details for verification
  res.json({
    method: req.method,
    url: req.url,
    headers: req.headers,
    query: req.query,
    body: req.body
  });
});
```

This allows property tests to verify that request configurations are correctly applied by comparing the mock server's received request with the original configuration.
