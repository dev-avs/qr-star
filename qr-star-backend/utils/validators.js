const imageType = import("image-type");

function isValidUrl(str) {
  try {
    let url = new URL(str);
    return url;
  } catch (_) {
    return false;
  }
}

function isValidBase64Image(str) {
  const matches = str.match(
    /^data:image\/([a-zA-Z]+);base64,([A-Za-z0-9+/=]+)$/
  );
  if (!matches) return false;

  try {
    const buffer = Buffer.from(matches[2], "base64");
    const type = imageType(buffer);
    return type && type.mime.startsWith("image/");
  } catch (e) {
    return false;
  }
}

function isValidColor(str) {
  const hexRegex = /^#?([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;
  const rgbRegex =
    /^rgb\(\s*(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\s*,\s*(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\s*,\s*(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\s*\)$/;

  return hexRegex.test(str) || rgbRegex.test(str);
}

const gradientObj = {}; // TODO

const qrOptReq = {
  width: { type: Number, required: false, default: 300 },
  height: { type: Number, required: false, default: 300 },
  type: {
    type: String,
    required: false,
    default: "canvas",
    enum: ["canvas", "svg"],
  },
  shape: {
    type: String,
    required: false,
    default: "square",
    enum: ["square", "circle"],
  },
  data: { type: String, required: true, validator: isValidUrl },
  image: {
    type: String,
    required: false,
    validator: { or: [isValidUrl, isValidBase64Image] },
  },
  margin: { type: Number, required: false, default: 0 },
  qrOptions: {
    typeNumber: { required: false, default: 0, min: 0, max: 40 },
    mode: {
      type: String,
      required: false,
      enum: ["Numeric", "Alphanumeric", "Byte", "Kanji"],
    },
    errorCorrectionLevel: {
      type: String,
      required: false,
      enum: ["L", "M", "Q", "H"],
    },
  },
  imageOptions: {
    hideBackgroundDots: { type: Boolean, required: false, default: true },
    imageSize: { type: Number, required: false, default: 0.4 },
    margin: { type: Number, required: false, default: 0 },
    crossOrigin: {
      type: String,
      required: false,
      enum: ["anonymous", "use-credentials"],
      default: "anonymous",
    },
  },
  dotsOptions: {
    color: {
      type: String,
      required: false,
      default: "#000",
      validator: isValidColor,
    },
    gradient: gradientObj,
    type: {
      type: String,
      required: false,
      default: "square",
      enum: [
        "rounded",
        "dots",
        "classy",
        "classy-rounded",
        "square",
        "extra-rounded",
      ],
    },
    roundSize: {
      type: Boolean,
      default: true,
    },
  },
  backgroundOptions: {
    color: {
      type: String,
      required: false,
      default: "#fff",
      validator: isValidColor,
    },
    gradient: gradientObj,
  },
  cornersSquareOptions: {},
};
function isValidQR(obj) {}

function isValidPassword(pw) {
  const minLength = 8;
  const specialCharRegex = /[^A-Za-z0-9]/;

  if (typeof pw !== "string") return false;

  return pw.length >= minLength && specialCharRegex.test(pw);
}

module.exports = {
  url: isValidUrl,
  password: isValidPassword
};
