//@ts-ignore
import httpGet from "./http-get.js";
import {ytmp3} from "@vreden/youtube_scraper";
import path from "path";

export default async function downloader( url: string, dirPath: string): Promise<boolean> {
  try {
    let result: any = {};
    const normalizedDir = path.resolve(dirPath);
    const ytresult = await ytmp3(url,256);
    if (ytresult?.status) {
      result.url = ytresult?.download?.url;
      console.log(result.url);
      result.title = ytresult?.metadata?.title.replace(/[^a-zA-Z0-9() ]+/g, '');
      result.status = ytresult?.status;
    }

    if (result?.status && result?.url) {
      return await httpGet(result.url, normalizedDir, "mp3", result.title);
    } else {
      throw new Error("Youtube not found");
    }
  } catch (e) {
    console.error("An error occurred:", e);
    return false;
  }
}