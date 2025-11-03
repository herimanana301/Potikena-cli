import fs from "fs";
import path from "path";
import { removeBackground } from "@imgly/background-removal-node";

export default async function remove(inputPath:string, outputDirPath:string) {
  try {
    // Convert to a valid file URL for the library
    const inputUrl = "file://" + path.resolve(inputPath);

    const blob = await removeBackground(inputUrl, {
      model: "medium",
    });

    const arrayBuffer = await blob.arrayBuffer();
    let outputPath = path.join(outputDirPath, path.basename(inputPath)).replace(path.extname(inputPath), "_no_bg.png");
    fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
    return true;
  } catch (error) {
    console.error("Error during background removal:", error);
    return false;
  }
}