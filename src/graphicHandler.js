const iconFinderApiKey = process.env.iconFinderApiKey;
const resultsPerPage = 32;

const axios = require('axios');

const PNG = require('pngjs').PNG;
const rgbaToZ64 = require('zpl-image').rgbaToZ64;
const fs = require('fs');
const path = require('path');

async function searchIconsFromIconFinder(searchTerm, size) {
    const url = `https://api.iconfinder.com/v4/icons/search?query=${encodeURIComponent(searchTerm)}&count=${resultsPerPage}&style=outline&size=${size}`;
    const response = await axios.get(url, {
        headers: {
            'Authorization': `Bearer ${iconFinderApiKey}`
        }
    });

    let icons = response.data.icons;

    // The IconFinder API searches for the entire phrase which can return limited results. 
    // Therefore, we will append results from just the first word if the results are less than the desired amount.
    if (icons.length < resultsPerPage) {
        // Perform additional search with just the first word as the query
        const firstWord = searchTerm.split(' ')[0];
        const additionalUrl = `https://api.iconfinder.com/v4/icons/search?query=${encodeURIComponent(firstWord)}&count=${resultsPerPage - icons.length}&style=outline&size=${size}`;
        const additionalResponse = await axios.get(additionalUrl, {
            headers: {
                'Authorization': `Bearer ${iconFinderApiKey}`
            }
        });

        // Append the additional results to the icons array
        icons = icons.concat(additionalResponse.data.icons);
    }

    // Process and return the relevant data from the response
    return icons.map(icon => {
        return {
            previewUrl: icon.raster_sizes[6].formats[0].preview_url,
            iconId: icon.icon_id
        };
    });
}

// Function to rotate the image 90 degrees counterclockwise
function rotateImage90Counterclockwise(png) {
    let rotated = new PNG({ width: png.height, height: png.width });

    for (let y = 0; y < png.height; y++) {
        for (let x = 0; x < png.width; x++) {
            let idx = (png.width * y + x) << 2;
            let rotIdx = (png.height * (png.width - x - 1) + y) << 2;
            rotated.data[rotIdx] = png.data[idx];
            rotated.data[rotIdx + 1] = png.data[idx + 1];
            rotated.data[rotIdx + 2] = png.data[idx + 2];
            rotated.data[rotIdx + 3] = png.data[idx + 3];
        }
    }

    return rotated;
}

// Function to resize the image to a specified maximum width
function resizeImage(png, maxWidth) {
    const aspectRatio = png.height / png.width;
    const newHeight = Math.floor(maxWidth * aspectRatio);
    const resized = new PNG({ width: maxWidth, height: newHeight });

    for (let y = 0; y < newHeight; y++) {
        for (let x = 0; x < maxWidth; x++) {
            const srcX = Math.floor(x / maxWidth * png.width);
            const srcY = Math.floor(y / newHeight * png.height);
            const srcIdx = (srcY * png.width + srcX) << 2;
            const destIdx = (y * resized.width + x) << 2;
            resized.data[destIdx] = png.data[srcIdx];
            resized.data[destIdx + 1] = png.data[srcIdx + 1];
            resized.data[destIdx + 2] = png.data[srcIdx + 2];
            resized.data[destIdx + 3] = png.data[srcIdx + 3];
        }
    }

    return resized;
}

// Function to download image from URL and convert to ZPL
async function convertImageToZPL(imageUrl, maxWidth = null, rotateCounterclockwise = false) {
    try {
        // Download the image
        const response = await axios({
            method: 'get',
            url: imageUrl,
            responseType: 'arraybuffer'
        });
        const imageBuffer = Buffer.from(response.data, 'binary');

        // Save the image temporarily
        const tempImagePath = path.join(__dirname, 'tempImage.png');
        fs.writeFileSync(tempImagePath, imageBuffer);

        // Convert the image to ZPL
        //const zpl = await zplImage.toZPL(tempImagePath, { compress: true });

        let buf = fs.readFileSync(tempImagePath);
        let png = PNG.sync.read(buf);

        // Rotate the image if needed
        if (rotateCounterclockwise) {
            png = rotateImage90Counterclockwise(png);
        }

        // Resize the image if maxWidth is provided
        if (maxWidth && png.width > maxWidth) {
            png = resizeImage(png, maxWidth);
        }

        let res = rgbaToZ64(png.data, png.width, { black:53 });

        // res.length is the uncompressed GRF length.
        // res.rowlen is the GRF row length.
        // res.z64 is the Z64 encoded string.
        let zpl = `^GFA,${res.length},${res.length},${res.rowlen},${res.z64}`;

        // Clean up: remove the temporary image file
        fs.unlinkSync(tempImagePath);

        return zpl;
    } catch (error) {
        console.error('Error converting image to ZPL:', error);
        throw error;
    }
}

module.exports = {
	searchIconsFromIconFinder,
    convertImageToZPL
};