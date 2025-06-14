import mongoose, { Schema } from "mongoose";
const adminSchema = new Schema({
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
    password: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String
    },
    role: { type: String, default: "admin", enum: ["admin"] },
}, { timestamps: true });

export const Admin = mongoose.model("Admin", adminSchema);

