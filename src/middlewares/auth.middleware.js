import { User } from "../models/user.model.js";
import { Apierror } from "../utils/Apierrors.js";
import { asyncHandler } from "../utils/Asynchandles.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const rawHeader = req.header("Authorization");
    const token =
      req.cookies?.accessToken || rawHeader?.replace("Bearer ", "").trim();

    // console.log("Authorization header:", rawHeader);
    // console.log("Extracted token:", token);

    if (!token) {
      throw new Apierror(401, "Unauthorized request.");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new Apierror(401, "Invalid access token.");
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("JWT verification failed:", error);
    throw new Apierror(401, error?.message || "Invalid access token.");
  }
});
