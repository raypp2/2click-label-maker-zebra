const iconifyApiUrl = 'https://api.iconify.design';
const resultsPerPage = 32; // Iconify's minimum search limit

// Single-color icon sets only; multicolor/emoji sets print poorly on a thermal printer
const iconSets = [
    'tabler', 'lucide', 'mdi', 'material-symbols', 'ph', 'fluent',
    'icon-park-outline', 'iconoir', 'streamline', 'game-icons'
].join(',');

const axios = require('axios');

const PNG = require('pngjs').PNG;
const { Resvg } = require('@resvg/resvg-js');
const rgbaToZ64 = require('zpl-image').rgbaToZ64;

async function searchIconify(query, limit) {
    const url = `${iconifyApiUrl}/search?query=${encodeURIComponent(query)}&limit=${limit}&prefixes=${iconSets}`;
    const response = await axios.get(url);
    return response.data.icons;
}

async function searchIcons(searchTerm) {
    let icons = await searchIconify(searchTerm, resultsPerPage);

    // Multi-word searches (e.g. "chicken tikka masala") often return few results.
    // Append results from just the first word if the results are less than the desired amount.
    const firstWord = searchTerm.trim().split(/\s+/)[0];
    if (icons.length < resultsPerPage && firstWord && firstWord !== searchTerm.trim()) {
        const additional = await searchIconify(firstWord, resultsPerPage);
        icons = [...new Set(icons.concat(additional))].slice(0, resultsPerPage);
    }

    // Iconify returns "prefix:name" ids; the SVG is served at /prefix/name.svg
    return icons.map(iconId => {
        const [prefix, name] = iconId.split(':');
        return {
            previewUrl: `${iconifyApiUrl}/${prefix}/${name}.svg`,
            iconId: iconId
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

// Render an SVG to a PNG sized so that, after any rotation, it is maxWidth wide
function renderSvg(svgBuffer, maxWidth, rotateCounterclockwise) {
    const resvg = new Resvg(svgBuffer, {
        fitTo: { mode: rotateCounterclockwise ? 'height' : 'width', value: maxWidth || 300 }
    });
    return PNG.sync.read(resvg.render().asPng());
}

// Function to download image (SVG or PNG) from URL and convert to ZPL
async function convertImageToZPL(imageUrl, maxWidth = null, rotateCounterclockwise = false) {
    try {
        // Download the image
        const response = await axios({
            method: 'get',
            url: imageUrl,
            responseType: 'arraybuffer'
        });
        const imageBuffer = Buffer.from(response.data, 'binary');

        const contentType = response.headers['content-type'] || '';
        const isSvg = contentType.includes('svg') || imageBuffer.subarray(0, 256).toString().includes('<svg');

        // SVGs render crisply at the target size; PNGs fall back to the pixel resize below
        let png = isSvg
            ? renderSvg(imageBuffer, maxWidth, rotateCounterclockwise)
            : PNG.sync.read(imageBuffer);

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

        return zpl;
    } catch (error) {
        console.error('Error converting image to ZPL:', error);
        throw error;
    }
}

module.exports = {
	searchIcons,
    convertImageToZPL
};