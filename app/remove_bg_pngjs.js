import fs from 'fs';
import { PNG } from 'pngjs';

fs.createReadStream('public/logo.png')
    .pipe(new PNG({ filterType: 4 }))
    .on('parsed', function() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let idx = (this.width * y + x) << 2;
                
                let r = this.data[idx];
                let g = this.data[idx+1];
                let b = this.data[idx+2];
                let a = this.data[idx+3];
                
                if (a === 0) continue; // Already transparent
                
                // If pixel is white or almost white, make it transparent
                if (r > 230 && g > 230 && b > 230) {
                    this.data[idx+3] = 0;
                }
                
                // If pixel is very dark (the RECIBET text), make it white so it's visible on dark mode
                else if (r < 70 && g < 70 && b < 120) {
                    this.data[idx] = 255;
                    this.data[idx+1] = 255;
                    this.data[idx+2] = 255;
                }
            }
        }
        
        this.pack().pipe(fs.createWriteStream('public/logo_transparent.png'));
        console.log('Background removed and text inverted!');
    });
