import { Router } from 'express'
import { loginUser, logoutUser, registerUser } from '../controllers/user.controller.js'
import { upload } from '../middleware/multer.middleware.js'
import { varifayJWT } from '../middleware/auth.middleware.js'
const router = Router()

router.route("/register").post(
    upload.single("avatar")
    ,registerUser
)
router.route("/login").post(loginUser)
router.route("/logout").post(varifayJWT, logoutUser)
export default router