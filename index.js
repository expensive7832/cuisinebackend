import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import User from "./Routes/User.js"
import FoodRoute from "./Routes/FoodRoute.js"
import path from "path"

dotenv.config()

const app = express()

app.use(express.json())

app.use(express.urlencoded({extended: true}))

//app.use(express.static(path.join(path.resolve(), "./../build")))

//app.get("*", (req, res) =>{
  //  res.sendFile(path.join(path.resolve(), "./../build/index.html"))
//})

app.use(cors())



app.use(User)

app.use(FoodRoute)

app.listen(process.env.PORT || 8000, () =>{
   console.log( `listening on port ${process.env.PORT}`)
})





export default app