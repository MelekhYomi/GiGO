const fs = require('fs');
const path = require('path');

function createMinimalWav(targetPath) {
  const sampleRate = 8000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = sampleRate * 2; // 1 second of silence (2 bytes per sample)
  const fileSize = 44 + dataSize;
  
  const buffer = Buffer.alloc(fileSize);
  
  // RIFF identifier
  buffer.write('RIFF', 0);
  // File size minus 8
  buffer.writeUInt32LE(fileSize - 8, 4);
  // RIFF type
  buffer.write('WAVE', 8);
  // Format chunk identifier
  buffer.write('fmt ', 12);
  // Format chunk length (16)
  buffer.writeUInt32LE(16, 16);
  // Sample format (uncompressed PCM = 1)
  buffer.writeUInt16LE(1, 20);
  // Channel count (1 = mono)
  buffer.writeUInt16LE(numChannels, 22);
  // Sample rate
  buffer.writeUInt32LE(sampleRate, 24);
  // Byte rate
  buffer.writeUInt32LE(byteRate, 28);
  // Block align
  buffer.writeUInt16LE(blockAlign, 32);
  // Bits per sample (16)
  buffer.writeUInt16LE(bitsPerSample, 34);
  // Data chunk identifier
  buffer.write('data', 36);
  // Data chunk length
  buffer.writeUInt32LE(dataSize, 40);
  
  // Data is already zero-filled (silence) by Buffer.alloc()
  
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, buffer);
  console.log(`Generated valid minimal WAV file of size ${buffer.length} bytes at: ${targetPath}`);
}

createMinimalWav(path.join(__dirname, 'test_assets/native_sample.wav'));
