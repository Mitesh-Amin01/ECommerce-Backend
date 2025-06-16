import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { User } from '../models/user.models.js'
import { ApiResponse } from '../utils/ApiResponse.js'

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, phone, fullname, password } = req.body

    if ([fullname, email, username, phone, password].some((field) => field.trim() === "")) {
        throw new ApiError(400, "All Fields Are Required")
    }
    const existedUser = await User.findOne({ $or: [{ username }, { email }] })
    console.log("DEBUGE:- ",existedUser)
    if(existedUser){
        throw new ApiError(409, "User With Email or Username Already Exists!")
    }
    const user = await User.create({username,fullname,email,phone,password})
    const createdUser = await User.findById(user._id)
    if(!createdUser){
        throw new ApiError(500,"Something Went Wrong While Registering The User")
    }
    return res.status(201).json(new ApiResponse(200,createdUser,"User Registered Successfully"))
})

export { registerUser }