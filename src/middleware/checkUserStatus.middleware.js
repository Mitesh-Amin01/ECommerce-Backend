import jwt from 'jsonwebtoken'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { User } from '../models/user.models.js'

export const checkUserStatus = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "").trim();

  if (!token) {
    throw new ApiError(401, "Access token not provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded._id).select("-password -refreshToken");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Token and user valid — return response
    return res.status(200).json(
      new ApiResponse(200, { user }, "User logged in successfully")
    );

  } catch (error) {
    // 👉 Token expired — allow refresh
    if (error.name === "TokenExpiredError") {
      console.log("Access token expired. Calling refresh...");
      return next();
    }

    // 👉 Any other error — invalid token
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
