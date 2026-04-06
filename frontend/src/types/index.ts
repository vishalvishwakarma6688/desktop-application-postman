export interface User {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Workspace {
    _id: string;
    name: string;
    owner: User;
    members: WorkspaceMember[];
    createdAt: string;
    updatedAt: string;
}

export interface WorkspaceMember {
    user: User;
    role: 'admin' | 'editor' | 'viewer';
}

export interface Collection {
    _id: string;
    name: string;
    description?: string;
    workspace: string | Workspace;
    creator: User;
    createdAt: string;
    updatedAt: string;
}

export interface Request {
    _id: string;
    name: string;
    collection: string | Collection;
    workspace: string | Workspace;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    headers: KeyValue[];
    queryParams: KeyValue[];
    body: RequestBody;
    auth: RequestAuth;
    scripts?: {
        pre?: string;
        post?: string;
    };
    isStarred: boolean;
    createdBy?: User;
    createdAt: string;
    updatedAt: string;
}

export interface KeyValue {
    key: string;
    value: string;
    enabled: boolean;
    type?: 'text' | 'file';
    fileData?: string;   // base64
    fileName?: string;
    fileType?: string;
}

export interface RequestBody {
    type: 'json' | 'form-data' | 'raw' | 'none';
    content: any;
}

export interface RequestAuth {
    type: 'bearer' | 'basic' | 'apikey' | 'none';
    bearer?: {
        token: string;
    };
    basic?: {
        username: string;
        password: string;
    };
    apikey?: {
        key: string;
        value: string;
        addTo: 'header' | 'query';
    };
}

export interface Environment {
    _id: string;
    name: string;
    workspace: string | Workspace;
    variables: EnvironmentVariable[];
    createdBy?: User;
    createdAt: string;
    updatedAt: string;
}

export interface EnvironmentVariable {
    key: string;
    value: string;
    enabled: boolean;
}

export interface RequestHistory {
    _id: string;
    user: string;
    request: Request;
    workspace: string | Workspace;
    requestSnapshot: {
        method: string;
        url: string;
        headers: any;
        body: any;
    };
    response: {
        status: number;
        statusText: string;
        data: any;
        headers: any;
        executionTime: number;
    };
    error?: {
        message: string;
        code: string;
    };
    executedAt: string;
}

export interface ExecuteRequestResponse {
    historyId: string;
    result: {
        status: number;
        statusText: string;
        data: any;
        headers: any;
        executionTime: number;
        error: any;
    };
    testResults?: { name: string; passed: boolean; error?: string }[];
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    count?: number;
    total?: number;
    error?: {
        message: string;
        type: string;
        details: any;
    };
}
