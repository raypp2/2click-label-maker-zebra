const iconFinderApiKey = process.env.iconFinderApiKey;
const resultsPerPage = 32;

const axios = require('axios');

const PNG = require('pngjs').PNG;
const rgbaToZ64 = require('zpl-image').rgbaToZ64;
const fs = require('fs');
const path = require('path');

async function searchIconsFromIconFinder(searchTerm) {
    const url = `https://api.iconfinder.com/v4/icons/search?query=${encodeURIComponent(searchTerm)}&count=${resultsPerPage}&style=outline`;
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
        const additionalUrl = `https://api.iconfinder.com/v4/icons/search?query=${encodeURIComponent(firstWord)}&count=${resultsPerPage - icons.length}&style=outline`;
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


// Function to download image from URL and convert to ZPL
async function convertImageToZPL(imageUrl) {
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