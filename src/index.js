import dotenv from "dotenv";
import connectDB from "./db/index.js";

const PORT = process.env.PORT || 3000;

dotenv.config({ path: "./env" });
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
});

/* This is another approach to connect to database but it clutters the index.js
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
