import fs from "fs";
import path from "path";
import sharp from "sharp";
import supportedFormats from "../data/mediasupportedformat.js";


type targetFormat = "png" | "jpg" | "jpeg" | "webp" | "avif" | "tiff" | "gif" | null

export default async function convertImage(
  inputPath: string,
  outputDirPath: string,
  targetFormat: targetFormat
): Promise<boolean> {
  try {
    const resolvedInput = path.resolve(inputPath);
    const resolvedOutputDir = path.resolve(outputDirPath);

    if (!fs.existsSync(resolvedInput)) {
      throw new Error("Input file does not exist");
    }
    //@ts-ignore
    if (!supportedFormats.includes(targetFormat)) {
      throw new Error(`Unsupported format: ${targetFormat}`);
    }

    const baseName = path.basename(resolvedInput, path.extname(resolvedInput));
    const outputPath = path.join(resolvedOutputDir, `${baseName}_converted.${targetFormat}`);

    const image = sharp(resolvedInput);

    switch (targetFormat) {
      case "jpg":
      case "jpeg":
        await image.jpeg({ quality: 90 }).toFile(outputPath);
        break;
      case "png":
        await image.png({ compressionLevel: 9 }).toFile(outputPath);
        break;
      case "webp":
        await image.webp({ quality: 90 }).toFile(outputPath);
        break;
      case "avif":
        await image.avif({ quality: 80 }).toFile(outputPath);
        break;
      case "tiff":
        await image.tiff({ quality: 90 }).toFile(outputPath);
        break;
      case "gif":
        await image.gif().toFile(outputPath);
        break;
      default:
        throw new Error(`Unhandled format: ${targetFormat}`);
    }

    console.log(`Image converted successfully: ${outputPath}`);
    return true;
  } catch (error) {
    console.error("Error during image conversion:", error);
    return false;
  }
}
