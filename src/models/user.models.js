import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    profilePicture: {
        type: String,
        default: ''
    },
    coverPicture: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    role: {
        type: String,
        enum: ['donor', 'reciever'],
        default: 'reciever',
        required: true
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true
    }
},{timestamps: true});


userSchema.pre('save', async function (next) {
    if( !this.isModified('password')) return next();
    this.password = bcrypt.hash(this.password, 10);
    next();
})

userSchema.methods.comparePassword = async function (password){
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function () {
    jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User = mongoose.model('User', userSchema);
