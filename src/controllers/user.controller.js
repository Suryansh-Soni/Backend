import { asyncHandler } from "../utils/Asynchandles.js";
import { Apierror } from "../utils/Apierrors.js";
import { User } from "../models/user.model.js";
import { uploadCloudinary } from "../utils/Cloudinary.js";
import { ApiRes } from "../utils/ApiRes.js";
import { ref } from "process";
import { access } from "fs";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();

    user.referenceToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new Apierror(
      500,
      "Something went wrong while generating refresh and access tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user info from front end
  // validation - not empty
  // check if user already exist : username, email
  // check for img , check for avatar
  // upload them to cloudinary,avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // retusn response

  const { username, email, fullname, password } = req.body;
  console.log("email:", email);

  //   if(fullname===""){
  //     throw new Apierror(400,"Full name required .")
  //   }

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new Apierror(400, "All field Required.");
  }

  const existedUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existedUser) {
    throw new Apierror(409, "User with email or username already exists");
  }

  console.log("req.files:", req.files);

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  // const coverimagePath = req.files?.coverimage[0]?.path;

  let coverimagePath;
  if (
    req.files &&
    Array.isArray(req.files.coverimage) &&
    req.files.coverimage.length > 0
  ) {
    coverimagePath = req.files.coverimage[0].path;
  }

  if (!avatarLocalPath) {
    throw new Apierror(400, "Avatar needed ");
  }
  const avatar = await uploadCloudinary(avatarLocalPath);
  const coverimage = await uploadCloudinary(coverimagePath);

  if (!avatar) {
    throw new Apierror(400, "Avatar is mandatory ");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverimage: coverimage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new Apierror(500, "User not regestered");
  }

  return res
    .status(201)
    .json(new ApiRes(200, createdUser, "User registered succesfully "));
});

const loginUser = asyncHandler(async (req, res) => {
  // req body->data
  //username or email
  // find the user
  // pass check
  //access and refresh token
  //send cokkies

  const { email, username, password } = req.body;
  if (!(username || email)) {
    throw new Apierror(400, "username or email is required .");
  }
  const user = await User.findOne({
    $or: [{ username }, { email }],
  }).select("+password");
  if (!user) {
    throw new Apierror(404, "User doent exist .");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new Apierror(401, "Invalid user credentials");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiRes(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in SUCCESSFULLY."
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiRes(200, {}, "User logged Out Successfully. "));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incommingRefreshToken =
    req.cokkies.referenceToken || req.body.refreshToken;
  if (!incommingRefreshToken) {
    throw new Apierror(401, "unauthorised request");
  }
  try {
    const decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new Apierror(401, "Invalid refresh token");
    }
    if (incommingRefreshToken !== user?.refreshToken) {
      throw new Apierror(401, "Refresh token is expired or used ");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiRes(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed."
        )
      );
  } catch (error) {
    throw new Apierror(401, error?.message || "Invalid refresh token2");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new Apierror(400, "Invalid old Password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiRes(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiRes(200, req.user, "current user fetched ."));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!(fullname || email)) {
    throw new Apierror(400, "All fields are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname: fullname,
        email: email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiRes(200, user, "Account deatils updated successfully "));
});

const updteUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new Apierror(400, "Avatar file is missing.");
  }
  const avatar = await uploadCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new Apierror(400, "Error while uploading avatar.");
  }
  const existingUser = await User.findById(req.user?._id);
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");
  if (existingUser?.avatarPublicId) {
    await cloudinary.uploader.destroy(existingUser.avatarPublicId);
  }

  return res
    .status(200)
    .json(new ApiRes(200, user, "avatar updated successfully"));
});

const updteUserCoverimage = asyncHandler(async (req, res) => {
  const coveriamgeLocalPath = req.file?.path;
  if (!coveriamgeLocalPath) {
    throw new Apierror(400, "Avatar file is missing.");
  }
  const coverimage = await uploadCloudinary(coveriamgeLocalPath);
  if (!coverimage.url) {
    throw new Apierror(400, "Error while uploading coverimage.");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverimage: coverimage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiRes(200, user, "coverimage updated successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updteUserAvatar,
  updteUserCoverimage,
};
