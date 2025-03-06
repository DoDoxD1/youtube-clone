import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({path: "./env"});
connectDB();




/*
import express from "express";
const app = express();
;(async()=>{
    try{
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        app.on("error",(error)=>{
            console.error("Error connecting to the database");
            throw error;
        })
        app.listen(3000,()=>{
            console.log("Server is running on port 3000");
    });
    }
    catch(error){
        console.error(error);
        throw error;
    }
})();*/