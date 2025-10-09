import mongoose from 'mongoose';
// No need for bcryptjs since you requested to skip it for now

const { Schema } = mongoose;

const userSchema = new Schema({
    // Fields from your required list and Sign Up screen
    prefix: { type: String, trim: true }, // Eg: Dr, Prof, Mr, Ms
    fullName: { type: String, required: [true, 'Full Name is required'], trim: true },
    email: { 
        type: String, 
        required: [true, 'Email is required'], 
        unique: true, 
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Email is invalid'] 
    },
    mobile: { 
        type: String, 
        required: [true, 'Mobile number is required'], 
        unique: true, 
        match: [/^\d{10}$/, 'Mobile number must be 10 digits'] 
    },
    country: { type: String },
    password: { type: String, required: [true, 'Password is required'] },
    
    // Fields from your My Profile screen (optional on signup, filled in later)
    designation: { type: String, trim: true },
    affiliationHospital: { type: String, trim: true },
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    pincode: { type: String, trim: true },
    
    // Additional fields
    profilePhoto: { type: String }, // URL or path to the uploaded photo
    resetPasswordToken: String,
    resetPasswordExpire: Date,
}, {
    timestamps: true,
});

// Virtual field for consistency (User_id is just _id in Mongoose)
// userSchema.virtual('User_id').get(function() {
//     return this._id;
// });

const User = mongoose.model('User', userSchema);
export default User;