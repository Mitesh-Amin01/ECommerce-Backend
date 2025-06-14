import mongoose, { Schema } from "mongoose"

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowecase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowecase: true,
        trim: true,
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
    },
    avatar: {
        type: String,
    },
    refreshToken: {
        type: String
    },
    phone: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Password is Required']
    },
    otpVerified: {
        type: Boolean,
        default: false
    },
    wishlist: [{
        type: Schema.Types.ObjectId,
        ref: "Product"
    }],
    cart: [{
        type: Schema.Types.ObjectId,
        ref: "Cart"
    }],
    orders: [{
        type: Schema.Types.ObjectId,
        ref: "Order"
    }],
    role: {
        type: String,
        default: "user",
        enum: ["user"]
    },
}, {
    timestamps: true
})

export const User = mongoose.model("User", userSchema)