// Load environment variables from .env file
require('dotenv').config()
const zplServerUrl = process.env.zplServerUrl;
const printerId = process.env.printerId;
const labelId = process.env.labelId;
const port = 80;

const { searchIconsFromIconFinder,
        convertImageToZPL } = require('./src/graphicHandler');

const { createZPL } = require('./src/zplGenerator');

const axios = require('axios');


// Create an mDNS Advertiser
const mdns = require('mdns');
const ad = mdns.createAdvertisement(mdns.tcp('http'), port, {
    name: 'label',
    domain: 'local'
  });
  ad.start();
  console.log('mDNS Advertiser started for label.local at port %d', port);


// Start web & api server
const express = require('express');
const app = express();
app.use(express.static('public')); // Serve static files from 'public' directory
app.use(express.json()); 

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Listen for API requests
app.get('/api/search-icons', async (req, res) => {
    const searchTerm = req.query.searchTerm;
    if (!searchTerm) {
        return res.status(400).send('Search term is required');
    }

    try {
        const icons = await searchIconsFromIconFinder(searchTerm);
        res.json(icons);
    } catch (error) {
        console.error('Error fetching icons:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.post('/api/convert-to-zpl', async (req, res) => {
    const { imageUrl } = req.body;
    try {
        const zplData = await convertImageToZPL(imageUrl);
        res.send(zplData);
    } catch (error) {
        res.status(500).send(`Error: ${error.message}`);
    }
});


app.post('/api/preview', async (req, res) => {
    const { primaryText, secondaryText, dateText, iconUrl } = req.body;

    let iconZpl = "";
    if (iconUrl) {
        try {
            iconZpl = await convertImageToZPL(iconUrl);
        } catch (error) {
            console.error('Error converting image to ZPL:', error);
            return res.status(500).send(`Error: ${error.message}`);
        }
    }

    const zplData = createZPL(primaryText, secondaryText, dateText, iconZpl);

    console.log("Generating ZPL preview");

    // Define the body of the POST request
    const postData = JSON.stringify({
        printer: printerId,
        label: labelId,
        zpl: zplData
    });

    // Call zpl-rest API for preview
    try {
        const zplRestResponse = await axios.post(zplServerUrl + '/rest/preview', postData, {
            headers: { 
                'Content-Type': 'application/json'
            }
        });

        const previewImageUrl = zplRestResponse.data;
        //console.log(previewImageUrl);
        res.send(previewImageUrl);
    } catch (error) {
        console.error("Error details:", error);
        res.status(500).send(`Error: ${error.message}`);
    }
});


app.post('/api/print', async (req, res) => {
    const { primaryText, secondaryText, dateText, iconUrl, qtyText } = req.body;

    let iconZpl = "";
    if (iconUrl) {
        try {
            iconZpl = await convertImageToZPL(iconUrl);
        } catch (error) {
            console.error('Error converting image to ZPL:', error);
            return res.status(500).send(`Error: ${error.message}`);
        }
    }
    
    const zplData = createZPL(primaryText, secondaryText, dateText, iconZpl);

    console.log("Printing %s labels", qtyText);
    //console.log(zplData);

    // Define the body of the POST request
    const postData = JSON.stringify({
        printer: printerId,
        label: labelId,
        data: {
            zpl: zplData
        }
    });

    // Parse the quantity and ensure it's a valid number and at least 1
    let qty = parseInt(qtyText, 10);
    qty = (isNaN(qty) || qty < 1) ? 1 : qty; // Default to 1 if not a valid number or less than 1
    
    let printSuccessful = true;

    // Call zpl-rest API for printing
    for (let i = 0; i < qty; i++) {
        try {
            const zplRestResponse = await axios.post(zplServerUrl + '/rest/print', postData, {
                headers: { 
                    'Content-Type': 'application/json'
                }
            });

            let printResult = "";
            if(zplRestResponse.data && !zplRestResponse.data.failed) {
                printResult = "Success";
            } else {
                printResult = "Failed: " + zplRestResponse.data.error;
                printSuccessful = false;
                break; // Stop printing if a failure occurs
            }

            console.log(`Print ${i+1} result:`, printResult);

        } catch (error) {
            console.error(`Error on print ${i+1}:`, error);
            printSuccessful = false;
            break; // Stop printing if an error occurs
        }
    }

    // Send response based on the print success
    if (printSuccessful) {
        console.log("All labels printed successfully.");
        res.send('All labels printed successfully.');
    } else {
        res.status(500).send('Printing failed.');
    }
});