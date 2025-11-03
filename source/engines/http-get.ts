import * as rdm from "randomstring";
import axios from "axios";
import { pipeline } from "node:stream/promises";
import * as fs from "fs";

export default async function httpGet(downloadLink: string, dirPath: string, extension:string,fileName : string = ""): Promise<boolean> {
  try {
    const filePath = fileName?`${dirPath}/${fileName}.${extension}`:`${dirPath}/potikena_${rdm.generate()}.${extension}`;
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