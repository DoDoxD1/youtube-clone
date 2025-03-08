import { ApiError } from "../utils/ApiError.js";

const validateUserFields = (fields) => {
  //checking if required feids are empty
  /* this code has a problem if multiple feilds are empty it'll keep throwing multiple errors
     fields.map((field) => {
       if (field.trim() === "") {
         throw new ApiError(400, `Required feild is empty`);
       }
     });*/
  // so we can use some here if it finds anything empty it will return true
  if (fields.some((field) => field?.trim() === "")) {
    throw new ApiError(400, `Required feild is empty`);
  }
};

const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    );
};

export { validateUserFields, validateEmail };
