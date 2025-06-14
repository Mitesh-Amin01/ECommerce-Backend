import mongoose, { Schema } from 'mongoose'

const sellerSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullname: {
        type: String,
        required: true,
        trim: true
    },
    avatar: {
        type: String
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String
    },
    otpVerified: {
        type: Boolean,
        default: false
    },
    shopName: {
        type: String,
        required: true
    },
    gstNumber: {
        type: String
    },
    products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    orders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    role: { type: String, default: "seller", enum: ["seller"] },
}, { timestamps: true });

export const Seller = mongoose.model("Seller", sellerSchema); 
