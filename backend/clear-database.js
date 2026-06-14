import mongoose from 'mongoose';
import readline from 'readline';
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

// ANSI color codes for better visibility
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m',
    bold: '\x1b[1m',
};

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Promisified question function
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Models to clear
const models = [
    { name: 'Users', model: User },
    { name: 'Workspaces', model: Workspace },
    { name: 'Collections', model: Collection },
    { name: 'Requests', model: Request },
    { name: 'Environments', model: Environment },
    { name: 'Request History', model: RequestHistory },
];

async function connectToDatabase() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/postman-like';

        console.log(`${colors.cyan}${colors.bold}Connecting to database...${colors.reset}`);
        console.log(`${colors.white}URI: ${MONGODB_URI}${colors.reset}\n`);

        await mongoose.connect(MONGODB_URI);

        console.log(`${colors.green}✓ Connected to MongoDB successfully!${colors.reset}\n`);
        return true;
    } catch (error) {
        console.error(`${colors.red}✗ Failed to connect to MongoDB:${colors.reset}`, error.message);
        return false;
    }
}

async function getCollectionCounts() {
    console.log(`${colors.blue}${colors.bold}Current Database Status:${colors.reset}`);
    console.log(`${colors.white}${'='.repeat(60)}${colors.reset}\n`);

    const counts = {};
    let totalDocuments = 0;

    for (const { name, model } of models) {
        try {
            const count = await model.countDocuments();
            counts[name] = count;
            totalDocuments += count;

            const countColor = count > 0 ? colors.yellow : colors.green;
            console.log(`${colors.cyan}${name.padEnd(20)}${colors.reset} ${countColor}${count} documents${colors.reset}`);
        } catch (error) {
            console.log(`${colors.cyan}${name.padEnd(20)}${colors.reset} ${colors.red}Error: ${error.message}${colors.reset}`);
            counts[name] = 0;
        }
    }

    console.log(`${colors.white}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.bold}Total Documents:${colors.reset} ${colors.yellow}${totalDocuments}${colors.reset}\n`);

    return { counts, totalDocuments };
}

async function clearDatabase() {
    console.log(`${colors.red}${colors.bold}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.red}${colors.bold}║          DATABASE DELETION SCRIPT                         ║${colors.reset}`);
    console.log(`${colors.red}${colors.bold}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);

    // Step 1: Connect to database
    const connected = await connectToDatabase();
    if (!connected) {
        console.log(`${colors.red}Cannot proceed without database connection.${colors.reset}`);
        process.exit(1);
    }

    // Step 2: Show current counts
    const { counts, totalDocuments } = await getCollectionCounts();

    if (totalDocuments === 0) {
        console.log(`${colors.green}${colors.bold}Database is already empty. Nothing to delete.${colors.reset}`);
        await mongoose.connection.close();
        process.exit(0);
    }

    // Step 3: First confirmation
    console.log(`${colors.red}${colors.bold}⚠️  WARNING: This will DELETE ALL DATA from the database!${colors.reset}`);
    console.log(`${colors.yellow}This action cannot be undone!${colors.reset}\n`);

    const confirm1 = await question(`${colors.yellow}Type 'DELETE' to continue: ${colors.reset}`);

    if (confirm1.trim() !== 'DELETE') {
        console.log(`${colors.green}\nOperation cancelled. No data was deleted.${colors.reset}`);
        await mongoose.connection.close();
        process.exit(0);
    }

    // Step 4: Second confirmation with count
    console.log(`${colors.red}\n⚠️  FINAL CONFIRMATION${colors.reset}`);
    console.log(`${colors.yellow}You are about to delete ${totalDocuments} documents!${colors.reset}\n`);

    const confirm2 = await question(`${colors.yellow}Type 'YES I AM SURE' to proceed: ${colors.reset}`);

    if (confirm2.trim() !== 'YES I AM SURE') {
        console.log(`${colors.green}\nOperation cancelled. No data was deleted.${colors.reset}`);
        await mongoose.connection.close();
        process.exit(0);
    }

    // Step 5: Delete all data
    console.log(`${colors.red}\n🗑️  Deleting all data...${colors.reset}\n`);

    let successCount = 0;
    let failCount = 0;

    for (const { name, model } of models) {
        try {
            if (counts[name] > 0) {
                const result = await model.deleteMany({});
                console.log(`${colors.green}✓${colors.reset} Deleted ${colors.yellow}${result.deletedCount}${colors.reset} ${name}`);
                successCount++;
            } else {
                console.log(`${colors.blue}○${colors.reset} Skipped ${name} (already empty)`);
            }
        } catch (error) {
            console.log(`${colors.red}✗${colors.reset} Failed to delete ${name}: ${error.message}`);
            failCount++;
        }
    }

    // Step 6: Show results
    console.log(`\n${colors.white}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.bold}Deletion Summary:${colors.reset}`);
    console.log(`${colors.green}Successful: ${successCount}${colors.reset}`);
    if (failCount > 0) {
        console.log(`${colors.red}Failed: ${failCount}${colors.reset}`);
    }

    // Step 7: Verify deletion
    console.log(`\n${colors.cyan}${colors.bold}Verifying deletion...${colors.reset}\n`);
    const { totalDocuments: remainingDocs } = await getCollectionCounts();

    if (remainingDocs === 0) {
        console.log(`${colors.green}${colors.bold}✓ Database successfully cleared! All data has been deleted.${colors.reset}\n`);
    } else {
        console.log(`${colors.yellow}⚠️  Warning: ${remainingDocs} documents still remain in the database.${colors.reset}\n`);
    }

    // Close connection
    await mongoose.connection.close();
    console.log(`${colors.cyan}Database connection closed.${colors.reset}`);
}

// Run the script
clearDatabase()
    .then(() => {
        rl.close();
        process.exit(0);
    })
    .catch((error) => {
        console.error(`${colors.red}${colors.bold}Fatal Error:${colors.reset}`, error);
        rl.close();
        process.exit(1);
    });
