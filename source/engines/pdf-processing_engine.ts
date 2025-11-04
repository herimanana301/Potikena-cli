import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";

export async function convertToPdf(inputPath: string, outputDirPath: string) {
  try {
    const imageBuffer = fs.readFileSync(inputPath);
    const ext = path.extname(inputPath).toLowerCase();

    const pdfDoc = await PDFDocument.create();

    let image;
    if (ext === ".png") {
      image = await pdfDoc.embedPng(imageBuffer);
    } else if (ext === ".jpg" || ext === ".jpeg") {
      image = await pdfDoc.embedJpg(imageBuffer);
    } else {
      throw new Error("Unsupported image format for PDF conversion.");
    }

    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });

    const pdfBytes = await pdfDoc.save();

    const outputPath = path.join(
      outputDirPath,
      path.basename(inputPath, path.extname(inputPath)) + "_converted.pdf"
    );

    fs.writeFileSync(outputPath, pdfBytes);

    return true;
  } catch (_) {
    console.log(_);
    return false;
  }
}