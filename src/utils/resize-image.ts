import sharp from 'sharp';

export async function resizeImage(
  filePath: string,
  outputPath: string,
): Promise<void> {
  await sharp(filePath).resize(320, 240, { fit: 'inside' }).toFile(outputPath);
}
