import mongoose from 'mongoose';
let mongoErrorMessage = '';
export const getMongoUri = () => process.env.MONGODB_URI || process.env.MONGO_URI || '';
export const connectDB = async () => {
    const uri = getMongoUri();
    if (!uri) {
        mongoErrorMessage = 'MONGODB_URI is not configured. Add it in your hosting environment settings.';
        console.error(mongoErrorMessage);
        return false;
    }
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
        mongoErrorMessage = '';
        console.log('MongoDB connected:', mongoose.connection.name);
        return true;
    }
    catch (err) {
        mongoErrorMessage = err instanceof Error ? err.message : String(err);
        console.error('MongoDB connection failed:', mongoErrorMessage);
        return false;
    }
};
export const getDbStatus = () => {
    const connected = mongoose.connection.readyState === 1;
    return {
        connected,
        type: connected ? 'mongodb' : 'unavailable',
        dbName: connected ? mongoose.connection.name : 'unavailable',
        host: connected ? mongoose.connection.host : 'unavailable',
        configuredUri: getMongoUri() ? 'Configured (hidden)' : 'Not configured',
        error: connected ? null : mongoErrorMessage || 'Database is not connected.',
    };
};
