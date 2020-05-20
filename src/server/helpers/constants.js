module.exports = {
    PHOTOS_DIR: process.env.PHOTOS_DIR ? process.env.PHOTOS_DIR : "./photos",
    VIDEOS_DIR: process.env.VIDEOS_DIR ? process.env.VIDEOS_DIR : "./videos",
    DATA_DIR: process.env.DATA_DIR ? process.env.DATA_DIR : ".",
    PORT: process.env.PHOTOS_PORT ? process.env.PHOTOS_PORT : 8080,
}