import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: "process.env.CLOUDINARY_CLOUD_NAME",
  api_key: "process.env.CLOUDINARY_API_KEY",
  api_secret: "process.env.CLOUDINARY_API_SECRET", // Click 'View API Keys' above to copy your API secret
});

const uploadCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload on clowdinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file upload successfully
    console.log("file loaded", response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove local saved file
    return null;
  }
};

export { uploadCloudinary };
