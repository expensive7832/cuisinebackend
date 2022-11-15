import pg from "pg"
import dotenv from "dotenv"

dotenv.config()

const {Pool, Client} = pg

const connection = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PWD,
    database: process.env.DB_NAME,
    ssl: true
});

connection.connect((err) => {
    if(err){
        console.log(`error in connection ${err}`)
    }else{
        
        console.log("connection to database successful")
    }
})






export default connection;