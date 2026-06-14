import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Import all models
import User from './src/models/User.js';
import Workspace from './src/models/Workspace.js';
import Collection from './src/models/Collection.js';
import Request from './src/models/Request.js';
import Environment from './src/models/Environment.js';
import RequestHistory from './src/models/RequestHistory.js';

const models = [
    { name: 'Users', model: User },
    { name: 'Workspaces', model: Workspace },
    { name: 'Collections', model: Collection },
    { name: 'Requests', model: Request },
    { name: 'Environments', model: Environment },
    { name: 'Request History', model: RequestHistory },
];

async function clearDatabaseForce() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/postman-like';

        console.log('Connecting to database...');
        await mongoose.connect(MONGODB_URI);
        console.log('✓ Connected\n');

        console.log('Deleting all data...\n');

        for (const { name, model } of models) {
            const result = await model.deleteMany({});
            console.log(`✓ Deleted ${result.deletedCount} ${name}`);
        }

        console.log('\n✓ Database cleared successfully!');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('✗ Error:', error.message);
        process.exit(1);
    }
}

clearDatabaseForce();
