import { asyncHandler } from "../utils/Asynchandles.js";
import { Apierror } from "../utils/Apierrors.js";
import { User } from "../models/user.model.js";
import { uploadCloudinary } from "../utils/Cloudinary.js";
import { ApiRes } from "../utils/ApiRes.js";

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

  const existedUser = User.findOne({ $or: [{ username }, { email }] });
  if (existedUser) {
    throw new Apierror(409, "User with eail or username already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverimagePath = req.files?.coverimage[0]?.path;

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
    .json(new ApiResponse(200, createdUser, "User registered succesfully "));
});

export { registerUser };
