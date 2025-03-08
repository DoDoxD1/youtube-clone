import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // if localfilepath exists upload to cloudinary
    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log(
      "File Uploaded on Cloudinary Successfully at URL: ",
      uploadResult.url,
    );
    return uploadResult;
  } catch (error) {
    // Remove the  file from local server when cloudinary upload fails
    fs.unlinkSync(localFilePath);
    console.error("File Uploaded Error:", error);
    return null;
  }
};

export { uploadOnCloudinary };
