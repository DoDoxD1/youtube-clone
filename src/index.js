import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import connectDB from "./db/index.js";
import { app } from "./app.js";

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MONGO db connection failed !!!", error);
  });

/* This is another approach to connect to database but it clutters the index.js above method creates
a function connectDB inside index.js file DB folder to seperate code 
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
