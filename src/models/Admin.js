import mongoose from 'mongoose';

const { Schema } = mongoose;

const adminSchema = new Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        // In a real app, you'd hash this. For now, it matches your request.
    },
}, {
    timestamps: true,
});

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;