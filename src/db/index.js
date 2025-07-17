import mongoose from "mongoose";
import { Db_name } from "../constants.js";

const connectdb = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${Db_name}`
    );
    console.log(
      `\n Mongodb connected !! DB host :${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("MongoDb connection error:", error);
    process.exit(1);
  }
};
export default connectdb;
