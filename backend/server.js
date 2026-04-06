import dotenv from 'dotenv';
dotenv.config();

// Dynamic import ensures dotenv runs before passport/app modules are evaluated
const { default: app } = await import('./src/app.js');
const { default: connectDB } = await import('./src/config/database.js');

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
