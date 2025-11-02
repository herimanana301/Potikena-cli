// downloader.ts
import axios from "axios";
import pkg from "shaon-videos-downloader";
import * as rdm from "randomstring";
import * as fs from "fs";
import { pipeline } from "node:stream/promises";
import {ytmp4} from "@vreden/youtube_scraper"

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

function findClosestQuality(desired: number, available: number[]): number {
  if (!available || available.length === 0) return desired;
  
  if (available.includes(desired)) return desired;
  
  const sorted:number[] = [...available].sort((a, b) => a - b) ;
  //@ts-ignore
  if (desired < sorted[0]) return sorted[0];
  //@ts-ignore
  if (sorted.length > 0 && desired > sorted[sorted.length - 1]) return sorted[sorted.length - 1];
  
  return sorted.reduce((prev, curr) => 
    Math.abs(curr - desired) < Math.abs(prev - desired) ? curr : prev
  );
}

export default async function downloader(choice: string, url: string, dirPath: string, ...args:Array<any>): Promise<boolean> {
  try {
    let result: any = {};
    switch (choice.toLowerCase()) {
      case "youtube":
        const requestedQuality = args[0];
        try {
          if (requestedQuality) {
            const qualityCheck = await ytmp4(url, 360);
            if (!qualityCheck || !qualityCheck.download || !qualityCheck.download.availableQuality) {
              console.error("Failed to fetch video information. The video might be unavailable or restricted.");
              return false;
            }

            const targetQuality = findClosestQuality(
              requestedQuality, 
              qualityCheck.download.availableQuality
            );

            const ytresult = await ytmp4(url, targetQuality);
            if (ytresult?.status && ytresult?.download?.url) {
              result.url = ytresult.download.url;
              result.status = ytresult.status;
            } else {
              console.error(`Failed to get download URL for quality: ${targetQuality}`);
              return false;
            }
          } else {
            // If no quality specified, try with default 360p
            const ytresult = await ytmp4(url, 360);
            if (ytresult?.status && ytresult?.download?.url) {
              result.url = ytresult.download.url;
              result.status = ytresult.status;
            } else {
              console.error("Failed to get download URL with default quality");
              return false;
            }
          }
        } catch (error) {
          console.error("YouTube download error:", error);
          return false;
        }
        break;
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