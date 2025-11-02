// downloader.ts
import axios from "axios";
import pkg from "shaon-videos-downloader";
import * as rdm from "randomstring";
import * as fs from "fs";
import { pipeline } from "node:stream/promises";

const { alldown } = pkg;
async function httpGet(downloadLink: string, dirPath: string): Promise<boolean> {
  try {
    const filePath = `${dirPath}/potikena_${rdm.generate()}.mp4`;

    const res = await axios.get(downloadLink, {
      responseType: "stream",
      maxRedirects: 5,
      validateStatus: (s) => s >= 200 && s < 400,
    });

    await pipeline(res.data, fs.createWriteStream(filePath));
    return true;
  } catch (err) {
    console.error("error downloading the video:", err);
    return false;
  }
}

export default async function downloader(choice: string, url: string, dirPath: string): Promise<boolean> {
  try {
    let result: any = {};
    switch (choice.toLowerCase()) {
      case "youtube":
      case "instagram":
      case "facebook":
      case "tiktok":
        // I keep the other options just in case we have to readapt it again later because shaon-videos-downloader got shutdown 
        result = await alldown(url);
        break;
      default:
        console.error("Please select an option.");
        return false;
    }

    if (result?.status && result?.url) {
      return await httpGet(result.url, dirPath);
    } else {
      throw new Error("No video found");
    }
  } catch (e) {
    console.error("An error occurred:", e);
    return false;
  }
}