const videoExtensions = [".mpg", ".mp2", ".mpeg", ".mpe", ".mpv", ".mp4"];
const imageExtensions = [".gif", ".jpeg", ".png", ".jpg"];
const isImage = (v) => {
  let status;
  imageExtensions.map((e) => {
    status = v.includes(e);
  });
  return status;
};
const isVideo = (v) => {
  let status;
  videoExtensions.map((e) => {
    status = v.includes(e);
  });

  return status;
};

export { isVideo, isImage };
