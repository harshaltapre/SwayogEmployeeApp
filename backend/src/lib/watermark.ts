import sharp from 'sharp';

export async function addWatermarkToImage(
  imagePath: string,
  employeeName: string,
  timestamp: string,
  latitude?: number,
  longitude?: number
): Promise<Buffer> {
  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    
    // Create watermark text
    const locationText = latitude && longitude 
      ? `📍 ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      : '';
    
    const watermarkText = `${employeeName}\n${timestamp}\n${locationText}`;
    
    // Create SVG for watermark
    const svgText = `
      <svg width="${metadata.width || 800}" height="${metadata.height || 600}">
        <style>
          .watermark {
            fill: rgba(255, 255, 255, 0.8);
            font-family: Arial, sans-serif;
            font-size: 24px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
          }
        </style>
        <text x="20" y="${(metadata.height || 600) - 80}" class="watermark">${watermarkText}</text>
      </svg>
    `;
    
    const svgBuffer = Buffer.from(svgText);
    
    // Composite watermark onto image
    const watermarkedImage = await image
      .composite([{ input: svgBuffer, top: 0, left: 0 }])
      .toBuffer();
    
    return watermarkedImage;
  } catch (error) {
    console.error('Error adding watermark:', error);
    throw error;
  }
}
