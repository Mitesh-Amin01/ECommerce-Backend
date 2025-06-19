import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { User } from '../models/user.models.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { uploadOnCloudinary } from '../utils/cloudnary.js'

const generateTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something Went Wrong While generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, phone, fullname, password } = req.body
    if ([fullname, email, username, phone, password].some((field) => field.trim() === "")) {
        throw new ApiError(400, "All Fields Are Required")
    }
    const existedUser = await User.findOne({ $or: [{ username }, { email }] })
    console.log("Test")
    if (existedUser) {
        throw new ApiError(409, "User With Email or Username Already Exists!")
    }
    const profileLocalPath = req.file?.path
    if (!profileLocalPath) console.log("Not Found Profile Image Parh! ", profileLocalPath);
    const profileImage = await uploadOnCloudinary(profileLocalPath)
    console.log("Check:- ", profileLocalPath)
    const user = await User.create({
        username,
        fullname,
        email,
        phone,
        password,
        avatar: profileImage.url || ""
    })
    const createdUser = await User.findById(user._id)
    if (!createdUser) {
        throw new ApiError(500, "Something Went Wrong While Registering The User")
    }
    return res.status(201).json(new ApiResponse(200, createdUser, "User Registered Successfully"))
})

const loginUser = asyncHandler(async (req, res) => {
    const { email, phoneNumber, password } = req.body

    if (!(email || phoneNumber)) {
        throw ApiError(400, "Email/PhoneNumber And Password Required!")
    }
    const user = await User.findOne({ $or: [{ email }, { phoneNumber }] })

    if (!user) {
        throw ApiError(404, "User Dose Not Exist!")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw ApiError(401, "Invalid User Credentials!")
    }

    const { accessToken, refreshToken } = await generateTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-refreshToken -password")

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: accessToken, refreshToken, loggedInUser
                },
                "User Logged In Successfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .josn(new ApiResponse(200, {}, "User Logged Out"))
})

export { registerUser, loginUser, logoutUser }