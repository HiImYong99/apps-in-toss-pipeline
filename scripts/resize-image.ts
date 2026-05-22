import sharp from 'sharp';

export async function resizeImage({
  inputPath,
  outputPath,
  width,
  height,
}: {
  inputPath: string;
  outputPath: string;
  width: number;
  height: number;
}): Promise<void> {
  await sharp(inputPath)
    .resize(width, height, { fit: 'cover' })
    .png()
    .toFile(outputPath);

  console.log(`Resized image saved to ${outputPath} (${width}x${height})`);
}

// Run as CLI if this file is the entry point
const isMain =
  process.argv[1] === new URL(import.meta.url).pathname ||
  process.argv[1]?.endsWith('resize-image.ts') ||
  process.argv[1]?.endsWith('resize-image.js');

if (isMain) {
  const args = process.argv.slice(2);

  function getArg(name: string): string | undefined {
    const idx = args.indexOf(`--${name}`);
    return idx !== -1 ? args[idx + 1] : undefined;
  }

  const input = getArg('input');
  const output = getArg('output');
  const widthStr = getArg('width');
  const heightStr = getArg('height');

  if (!input || !output || !widthStr || !heightStr) {
    console.error(
      'Usage: tsx scripts/resize-image.ts --input /tmp/raw.png --output /tmp/final.png --width 600 --height 600'
    );
    process.exit(1);
  }

  const width = parseInt(widthStr, 10);
  const height = parseInt(heightStr, 10);

  if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
    console.error('Error: --width and --height must be positive integers');
    process.exit(1);
  }

  resizeImage({ inputPath: input, outputPath: output, width, height }).catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
}
