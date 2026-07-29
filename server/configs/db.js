import mongoose from 'mongoose';
import dns from 'dns';

// Fix querySrv ECONNREFUSED by using Google DNS for SRV record lookups
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
    console.log('DNS setServers error:', e.message);
}

const connectDB = async () =>{
    try {
        mongoose.connection.on('connected', ()=> console.log('Database connected'));
        await mongoose.connect(`${process.env.MONGODB_URI}/ticketly`, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000
        })
    } catch (error) {
        console.log('Database connection error:', error.message);
    }
}

export default connectDB;