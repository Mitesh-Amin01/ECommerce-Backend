import { Router } from 'express'
import { loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar } from '../controllers/user.controller.js'
import { upload } from '../middleware/multer.middleware.js'
import { varifayJWT } from '../middleware/auth.middleware.js'
import { checkUserStatus } from '../middleware/checkUserStatus.middleware.js'
const router = Router()

router.route("/register").post(
    upload.single("avatar")
    ,registerUser
)
router.route("/login").post(loginUser)
router.route("/logout").post(varifayJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/user-auth").post(checkUserStatus,refreshAccessToken)
router.route("/account/change/details").patch(updateAccountDetails)
router.route("/account/change/avatar").patch(varifayJWT, upload.single("avatar"), updateUserAvatar)

export default router