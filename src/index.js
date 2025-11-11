import express from 'express';
import connectDB from './db/index.js';
import dotenv from "dotenv";
dotenv.config({
        path: './.env.local'
    }
);

connectDB();

const app = express();

app.get('/', (req, res) => {
  res.send('<h1>Hello, World!</h1>');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});