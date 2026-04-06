🚀 Backend MVP for Postman-like App
🧠 Core Features (MVP Scope)

We’ll keep it realistic but powerful:

User Authentication (JWT)
Workspaces
Collections
Requests (API configs)
Environments (variables like Postman)
Request History
Favorites / Starred Requests
🧱 Tech Stack (Backend)

Since you're already comfortable:

Node.js + Express
MongoDB + Mongoose
Redis (optional later for caching)
JWT Auth
Axios (for executing requests)
UUID
📁 Folder Structure
backend/
│
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── middlewares/
│   ├── utils/
│   ├── config/
│   └── app.js
│
├── server.js
├── .env
└── package.json
🧬 DATABASE DESIGN (IMPORTANT PART)

This is where most people fail — I’ll give you real-world scalable schemas

👤 1. User Schema
// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },

  // Optional future use
  avatar: String,

  createdAt: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.model("User", userSchema);
🏢 2. Workspace Schema

(Like Postman workspace)

// models/Workspace.js
const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  members: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      role: {
        type: String,
        enum: ["admin", "editor", "viewer"],
        default: "viewer",
      }
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  }
});
📂 3. Collection Schema

(Group of requests)

// models/Collection.js
const collectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workspace",
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  description: String,

  createdAt: {
    type: Date,
    default: Date.now,
  }
});
🌐 4. Request Schema (CORE)

This is the heart of your app.

// models/Request.js
const requestSchema = new mongoose.Schema({
  name: String,

  collection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Collection",
  },

  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workspace",
  },

  method: {
    type: String,
    enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    required: true,
  },

  url: {
    type: String,
    required: true,
  },

  headers: [
    {
      key: String,
      value: String,
    }
  ],

  queryParams: [
    {
      key: String,
      value: String,
    }
  ],

  body: {
    type: {
      type: String,
      enum: ["none", "json", "form-data", "raw"],
      default: "none",
    },
    content: mongoose.Schema.Types.Mixed,
  },

  auth: {
    type: {
      type: String,
      enum: ["none", "bearer", "basic", "apikey"],
      default: "none",
    },
    token: String,
    username: String,
    password: String,
    apiKey: String,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  isStarred: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  }
});
🌍 5. Environment Schema

(Postman variables like {{base_url}})

// models/Environment.js
const environmentSchema = new mongoose.Schema({
  name: String,

  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workspace",
  },

  variables: [
    {
      key: String,
      value: String,
    }
  ],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  }
});
📜 6. Request History Schema
// models/RequestHistory.js
const requestHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Request",
  },

  response: {
    status: Number,
    data: mongoose.Schema.Types.Mixed,
    headers: mongoose.Schema.Types.Mixed,
    time: Number,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  }
});
⚙️ CORE SERVICE: Execute API Request
// services/requestExecutor.js
import axios from "axios";

export const executeRequest = async (reqData) => {
  try {
    const start = Date.now();

    const response = await axios({
      method: reqData.method,
      url: reqData.url,
      headers: Object.fromEntries(
        reqData.headers.map(h => [h.key, h.value])
      ),
      params: Object.fromEntries(
        reqData.queryParams.map(q => [q.key, q.value])
      ),
      data: reqData.body?.content,
    });

    const end = Date.now();

    return {
      status: response.status,
      data: response.data,
      headers: response.headers,
      time: end - start,
    };

  } catch (error) {
    return {
      status: error.response?.status || 500,
      data: error.response?.data || error.message,
      headers: error.response?.headers || {},
      time: 0,
    };
  }
};
🔐 Auth (JWT Basic)
// utils/jwt.js
import jwt from "jsonwebtoken";

export const generateToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};
🧭 API ROUTES (MVP)
Auth
POST /api/auth/register
POST /api/auth/login
Workspace
POST /api/workspaces
GET /api/workspaces
Collections
POST /api/collections
GET /api/collections/:workspaceId
Requests
POST /api/requests
GET /api/requests/:collectionId
POST /api/requests/execute   🔥
Environment
POST /api/environments
GET /api/environments/:workspaceId
🔥 MVP FLOW (IMPORTANT)
User login/signup
Create workspace
Create collection
Add request
Execute request
Save history