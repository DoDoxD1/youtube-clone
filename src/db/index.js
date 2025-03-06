import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        console.log(`Connected to the database DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("MongoDB Connection Failed: ",error);
        process.exit(1);    
    }
};

export default connectDB;