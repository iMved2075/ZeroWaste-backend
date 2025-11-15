import connectDB from './db/index.js';
import dotenv from "dotenv";
import app from './app.js';
dotenv.config({
    path: './.env'
})

connectDB()
.then(() => {
  app.listen(process.env.PORT || 5000, () => {
      console.log(`Server is running on port ${process.env.PORT || 5000}`);
  });
})
.catch((err) => {
    console.log("Error in DB connection:", err);
});

