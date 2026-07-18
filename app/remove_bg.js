import Jimp from 'jimp';

async function removeWhiteBg() {
    try {
        const image = await Jimp.read('public/logo.png');
        
        // Tolerance for white
        const tolerance = 240;

        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            const r = this.bitmap.data[idx + 0];
            const g = this.bitmap.data[idx + 1];
            const b = this.bitmap.data[idx + 2];
            
            if (r >= tolerance && g >= tolerance && b >= tolerance) {
                this.bitmap.data[idx + 3] = 0; // Set alpha to 0 (transparent)
            }
        });

        await image.writeAsync('public/logo.png');
        console.log('Background removed successfully.');
    } catch (err) {
        console.error(err);
    }
}

removeWhiteBg();
