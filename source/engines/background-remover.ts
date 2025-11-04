import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { removeBackground } from "@imgly/background-removal-node";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function remove(inputPath: string, outputDirPath: string) {
  try {
    const inputUrl = "file://" + path.resolve(inputPath);

    let libDistPath: string;
    try {
      const resolved = require.resolve("@imgly/background-removal-node");
      libDistPath = path.join(path.dirname(resolved), "dist");
    } catch {
      const projectRoot = path.resolve(__dirname, "../../");
      libDistPath = path.join(projectRoot, "node_modules/@imgly/background-removal-node/dist");
    }

    const publicPath = `file://${libDistPath.replace(/\\/g, "/")}/`;

    const blob = await removeBackground(inputUrl, {
      model: "medium",
      publicPath,
    });

    const arrayBuffer = await blob.arrayBuffer();
    const outputPath = path
      .join(outputDirPath, path.basename(inputPath))
      .replace(path.extname(inputPath), "_no_bg.png");

    fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
    return true;
  } catch (_) {
    return false;
  }
}
