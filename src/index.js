import express from 'express';
import connectDB from './db/index.js';
import dotenv from "dotenv";
dotenv.config({
        path: './.env.local'
    }
);


const app = express(); 

connectDB()
.then(() => {
  app.listen(process.env.PORT || 5000, () => {
      console.log(`Server is running on port ${process.env.PORT || 5000}`);
  });
})
.catch((err) => {
    console.log("Error in DB connection:", err);
});

