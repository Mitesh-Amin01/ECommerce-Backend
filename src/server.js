import express from 'express'
import cors from 'cors'
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}))
app.use(express.static("public"))
app.use(cookieParser())


// routes import
import userRouter from "./routes/user.routes.js"
import { errorMiddleware } from './middleware/error.middleware.js'

app.use('/v1/users',userRouter)
app.use(errorMiddleware);
export { app }
