const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function run() {
  const refImage = 'C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\0c7ded65-af0b-4dcb-a499-5d7d3366f11b\\media__1774495601595.jpg';
  
  const buffer = await sharp(refImage)
    .raw()
    .toBuffer({ resolveWithObject: true });
    
  const w = buffer.info.width;
  const h = buffer.info.height;
  const data = buffer.data;
  
  console.log(`Image size: ${w}x${h}`);
  
  // Find "Baraa Al-Saidi" (Center-Left)
  // Search window: x in 300..1500, y in 400..800
  let nameMinY = h, nameMaxY = 0, nameMinX = w, nameMaxX = 0;
  for (let y = 400; y < 800; y++) {
    for (let x = 300; x < 1500; x++) {
      const idx = (y * w + x) * buffer.info.channels;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      if (r < 50 && g < 50 && b < 50) { // Very dark text
        if (y < nameMinY) nameMinY = y;
        if (y > nameMaxY) nameMaxY = y;
        if (x < nameMinX) nameMinX = x;
        if (x > nameMaxX) nameMaxX = x;
      }
    }
  }
  console.log(`Name text bounds: minX=${nameMinX}, maxX=${nameMaxX}, minY=${nameMinY}, maxY=${nameMaxY}`);
  console.log(`Name Center Y: ${(nameMinY + nameMaxY) / 2}`);
  
  // Find top-right serial code "ITQ-MAK..."
  // Search window: x in 1800..2500, y in 20..200
  let serialMinY = h, serialMaxY = 0, serialMinX = w, serialMaxX = 0;
  for (let y = 20; y < 200; y++) {
    for (let x = 1800; x < 2500; x++) {
      const idx = (y * w + x) * buffer.info.channels;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      if (r < 60 && g < 60 && b < 60) {
        if (y < serialMinY) serialMinY = y;
        if (y > serialMaxY) serialMaxY = y;
        if (x < serialMinX) serialMinX = x;
        if (x > serialMaxX) serialMaxX = x;
      }
    }
  }
  console.log(`Top-Right Serial bounds: minX=${serialMinX}, maxX=${serialMaxX}, minY=${serialMinY}, maxY=${serialMaxY}`);
  console.log(`Top-Right Serial Center Y: ${(serialMinY + serialMaxY) / 2}`);
  
  // Notice there's a bottom serial code? The user said "serial number is at the bottom"!
  // Search window: x in 600..2000, y in 1400..1684
  let botMinY = h, botMaxY = 0, botMinX = w, botMaxX = 0;
  for (let y = 1400; y < 1684; y++) {
    for (let x = 600; x < 2000; x++) {
      const idx = (y * w + x) * buffer.info.channels;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      if (r < 60 && g < 60 && b < 60) {
        if (y < botMinY) botMinY = y;
        if (y > botMaxY) botMaxY = y;
        if (x < botMinX) botMinX = x;
        if (x > botMaxX) botMaxX = x;
      }
    }
  }
  console.log(`Bottom Serial bounds: minX=${botMinX}, maxX=${botMaxX}, minY=${botMinY}, maxY=${botMaxY}`);
  console.log(`Bottom Serial Center Y: ${(botMinY + botMaxY) / 2}`);
  
  // Find the photo!
  // The boy with red/white keffiyeh. Keffiyeh is red and white. Face is skin color.
  // The background of certificate is beige.
  // Let's sample colors in the circle area (x:1500..2400, y:200..1300)
  // To find the edge of the photo, we just look for something that is NOT beige, gold, or brown.
  // The photo has pure white (255,255,255) and black from the iqal, etc.
  let photoMinY = h, photoMaxY = 0, photoMinX = w, photoMaxX = 0;
  for (let y = 200; y < 1300; y++) {
    for (let x = 1600; x < 2400; x++) {
      const idx = (y * w + x) * buffer.info.channels;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      
      // Black pixels of his Iqal (headband)
      if (r < 30 && g < 30 && b < 30) {
        if (y < photoMinY) photoMinY = y;
        if (y > photoMaxY) photoMaxY = y;
        if (x < photoMinX) photoMinX = x;
        if (x > photoMaxX) photoMaxX = x;
      }
    }
  }
  console.log(`Photo Iqal (Black bounds): minX=${photoMinX}, maxX=${photoMaxX}, minY=${photoMinY}, maxY=${photoMaxY}`);
  
}
run();
