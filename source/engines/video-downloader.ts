// downloader.ts
import pkg from "shaon-videos-downloader";
import httpGet from "./http-get.js";

const { alldown } = pkg;

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
      return await httpGet(result.url, dirPath, "mp4");
    } else {
      throw new Error("No video found");
    }
  } catch (e) {
    console.error("An error occurred:", e);
    return false;
  }
}