import "dotenv/config";

async function main() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME ?? "";
  const key = process.env.CLOUDINARY_API_KEY ?? "";
  const secret = process.env.CLOUDINARY_API_SECRET ?? "";

  console.log("Cloud name :", cloud, `(length ${cloud.length})`);
  console.log("API key    : length", key.length, /^\d+$/.test(key) ? "(digits only, good)" : "(NOT digits only, check it)");
  console.log("API secret : length", secret.length);
  console.log("Spaces or quotes inside the values?", /[\s"']/.test(cloud + key + secret) ? "YES, remove them" : "no");

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/ping`, {
    headers: { Authorization: "Basic " + Buffer.from(`${key}:${secret}`).toString("base64") },
  });
  console.log("Cloudinary answered:", response.status, await response.text());
}

main();
