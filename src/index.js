//   //require('dotenv').config({path: './env'})

// import mongoose from "mongoose";
// import { Db_name } from "./constants";
import dotenv from "dotenv";
import connectdb from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

connectdb()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`server running in port :${process.env.PORT} `);
    });
  })
  .catch((err) => {
    console.log("mongo db connection failed");
  });

// First approch

// import express from "express";

// const app = express();

// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGO_URI}/${Db_name}`);
//     app.on("error", (error) => {
//       console.log("error:", error);
//       throw error;
//     });
//     app.listen(process.env.PORT, () => {
//       console.log(`App is listening on port ${process.env.PORT}`);
//     });
//   } catch (error) {
//     console.error("Error connecting to the database:", error);
//     throw error;
//   }
// })();
