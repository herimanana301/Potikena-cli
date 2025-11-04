import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import * as rdm from "randomstring";

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

export async function mergePDFs(inputPaths: string[], outputDir: string): Promise<boolean> {
  try {
    if (!inputPaths.length) throw new Error("No PDF files provided.");

    const mergedPdf = await PDFDocument.create();

    for (const pdfPath of inputPaths) {
      const ext = path.extname(pdfPath).toLowerCase();
      if (ext !== ".pdf") {
        throw new Error(`File is not a PDF: ${pdfPath}`);
      }

      const pdfBytes = fs.readFileSync(pdfPath);
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

      copiedPages.forEach(page => mergedPdf.addPage(page));
    }

    const outputFileName = `potikena_${rdm.generate()}_merged.pdf`;
    const outputPath = path.join(outputDir, outputFileName);
    const mergedBytes = await mergedPdf.save();
    fs.writeFileSync(outputPath, mergedBytes);

    return true;
  } catch (error) {
    console.error("Error merging PDFs:", error);
    return false;
  }
}