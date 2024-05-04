import {connectDB} from "./db/database.js";
import dotenv from 'dotenv';
dotenv.config({path:'./env'});
import express from 'express';

const app = express();
connectDB() 

.then(() => {
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`server is runiig ${process.env.PORT}`)
    });
}).catch((err) => {
    console.log("mongo db connect lose",err)
});