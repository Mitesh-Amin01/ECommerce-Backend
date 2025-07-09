import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { User } from '../models/user.models.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { uploadOnCloudinary } from '../utils/cloudnary.js'
import { sendOtpEmail } from '../utils/mailer.js'
import jwt from 'jsonwebtoken'
import redis from '../utils/redisClient.js'
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
    const { username, email, phone, firstName, lastName, password } = req.body;

    // console.log("User signup Value:- ", password);

    if (
        [firstName, lastName, email, username, phone, password].some(
            (field) => field.trim() === ""
        )
    ) {
        throw new ApiError(400, "All Fields Are Required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw new ApiError(409, "User With Email or Username Already Exists!");
    }

    const profileLocalPath = req.file?.path;
    if (!profileLocalPath)
        console.log("Not Found Profile Image Path! ", profileLocalPath);

    const profileImage = await uploadOnCloudinary(profileLocalPath);

    const user = await User.create({
        username,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        avatar:
            profileImage?.url ||
            "https://res.cloudinary.com/dcnb4gg72/image/upload/v1750743495/avatar_bg_zfk1ms.jpg",
        otpVerified: true,
    });

    const createdUser = await User.findById(user._id);

    if (!createdUser) {
        throw new ApiError(
            500,
            "Something Went Wrong While Registering The User"
        );
    }

    return res
        .status(201)
        .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});


const loginUser = asyncHandler(async (req, res) => {
    const { email, phoneNumber, password } = req.body

    if (!(email || phoneNumber)) {
        throw new ApiError(400, "Email/PhoneNumber And Password Required!")
    }
    const user = await User.findOne({
        $or: [
            email ? { email } : null,
            phoneNumber ? { phoneNumber } : null
        ].filter(Boolean)
    });

    if (!user) {
        throw new ApiError(404, "User Dose Not Exist!")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid User Credentials!")
    }

    const { accessToken, refreshToken } = await generateTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-refreshToken -password")

    const options = {
        httpOnly: true,
        secure: true,
        maxAge: 10 * 24 * 60 * 60 * 1000
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
    // console.log("Req Body:- ", req.user._id)

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: { refreshToken: "" }
        },
        { new: true }
    )

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logged Out"))
})


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Request")
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalide RefreshToken")
        }
        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true,
            maxAge: 10 * 24 * 60 * 60 * 1000
        }
        const { accessToken, refreshToken } = await generateTokens(user._id)
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken
                    },
                    "User Logged In Successfully"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token!")
    }

})

const changeCurrentPasword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confPassword } = req.body
    if (!(newPassword === confPassword)) {
        throw new ApiError(400, "New Password And Confirm Password Don't Match")
    }
    if (newPassword === oldPassword) {
        throw new ApiError(400, "New and Old Password Must Be Deffrent!")
    }
    const user = await User.findById(req?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Old Password")
    }
    user.password = newPassword
    await user.save({ validateBeforeSave: false })
    return res.status(200).json(
        new ApiResponse(200, {}, "Password Change Successfuly!")
    )
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { firstName, lastName, username, birthdate, gender } = req.body;

    if ([firstName, lastName, username, birthdate, gender].some(field => field.trim() === "")) {
        throw new ApiError(400, "All Fields Are Required!");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                username: username.trim().toLowerCase(),
                birthdate,
                gender,
            },
        },
        { new: true }
    ).select("-refreshToken -password");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    res.status(200).json(new ApiResponse(200, user, "Account details updated successfully!"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const profileLocalPath = req.file?.path
    if (!profileLocalPath) {
        throw new ApiError(400, "Avatar File is Missing!")
    }
    const profileImage = await uploadOnCloudinary(profileLocalPath)
    if (!profileImage.url) {
        throw new ApiError(400, "Error While Uploading on Avatar")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: profileImage.url
            }
        },
        { new: true }).select("-refreshToken -password")
    return res.status(200).json(new ApiResponse(200, user, "Account Avatar updated successfully!"))
})

const deleteUserAccount = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(400, "Invalid request: User ID is missing");
    }

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
        throw new ApiError(404, "User not found");
    }

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, null, "User account deleted successfully"))
});

const sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  // 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store OTP in Redis for 10 minutes
  await redis.set(`otp:${email}`, otp, { EX: 600 });

  // Send email
  await sendOtpEmail(email, otp);

  return res.status(200).json({
    success: true,
    message: 'OTP sent to your email',
  });
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  const storedOtp = await redis.get(`otp:${email}`);

  if (!storedOtp) {
    return res.status(400).json({ message: 'OTP expired or not found' });
  }

  if (storedOtp !== otp) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  // OTP is correct ➝ Mark email as verified for now (optional flag)
  await redis.set(`verified:${email}`, 'true', { EX: 600 }); // valid for 10 mins before register

  // Optionally remove the OTP
  await redis.del(`otp:${email}`);

  return res.status(200).json({
    success: true,
    message: 'Email verified successfully',
  });
};


export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPasword, updateAccountDetails, updateUserAvatar, deleteUserAccount, generateTokens, sendOtp, verifyOtp }