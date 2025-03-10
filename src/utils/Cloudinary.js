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
    // console.log("Cloudinary result: ", uploadResult);
    // console.log(
    //   "File Uploaded on Cloudinary Successfully at URL: ",
    //   uploadResult.url,
    // );
    fs.unlinkSync(localFilePath);
    return uploadResult;
  } catch (error) {
    // Remove the  file from local server when cloudinary upload fails
    fs.unlinkSync(localFilePath);
    console.error("File Upload Error:", error);
    return null;
  }
};

const extractPublicId = (url) => {
  const urlParts = url.split("/");
  // Find the index of 'upload' and get everything after it except the extension
  const uploadIndex = urlParts.indexOf("upload");
  if (uploadIndex === -1 || uploadIndex + 1 >= urlParts.length) return null;

  // Remove version if present (e.g., v1700000000)
  let publicId = urlParts.slice(uploadIndex + 1).join("/");
  publicId = publicId.replace(/v\d+\//, ""); // Remove version
  publicId = publicId.replace(/\.[^/.]+$/, ""); // Remove file extension

  return publicId;
};

const deleteFromCloudinary = async (url) => {
  try {
    const response = cloudinary.uploader.destroy(
      extractPublicId(url),
      { invalidate: true },
      function (result) {
        console.log(result);
      },
    );
    return response;
  } catch (error) {
    console.error("File deletion error:", error);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
