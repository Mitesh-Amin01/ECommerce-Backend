import connectDB from "./db/db.js";
import { app } from "./server.js";
connectDB()
    .then(() => {
        app.on("error",(err)=>{
            console.log("Error: ",err)
            throw err
        })
        app.listen(process.env.PORT || 3000, () => {
            console.log(`Server Runing on Port ${process.env.PORT}`)
        })
    })
    .catch((err) => {
        console.log("MONGO DB Connection Failed!: ", err);
    })