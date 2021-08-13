const cloudinary = require("cloudinary").v2;
const { createWriteStream } = require("fs");
const { join, parse } = require("path");
require("dotenv").config({
  path: "variables.env",
});

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const subirImage = async (imagen) => {
  const { createReadStream, filename, mimetype, encoding } = await imagen;

  // Invoking the `createReadStream` will return a Readable Stream.
  // See https://nodejs.org/api/stream.html#stream_readable_streams
  const stream = createReadStream();
  const { ext, name } = parse(filename);

  let serverFile = join(__dirname, `../img/${name}${ext}`);
  let writStream = await createWriteStream(serverFile);
  await stream.pipe(writStream);
  stream.destroy();
};

module.exports = {
  subirImage,
};
