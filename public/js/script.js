
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('previewButton').addEventListener('click', previewLabel);
    document.getElementById('printButton').addEventListener('click', printLabel);
    document.getElementById('searchIconsButton').addEventListener('click', searchIcons);
    document.getElementById('startOverButton').addEventListener('click', startOver);

    // Preset the date and quantity fields with default values
    document.getElementById('dateText').value = dateTodayFormatted();
    document.getElementById('qtyText').value = '1';
});

document.getElementById('primaryText').focus();


async function previewLabel() {
    const primaryText = document.getElementById('primaryText').value;
    const secondaryText = document.getElementById('secondaryText').value;
    const dateText = document.getElementById('dateText').value;
    const iconUrl = document.getElementById('iconUrl').value;

    showLoading();
    try {
        const response = await axios.post('/api/preview', {
            primaryText: primaryText,
            secondaryText: secondaryText,
            dateText: dateText,
            iconUrl: iconUrl
        });

        // Assuming you have an img element with id 'preview-image' in your HTML
        const previewImage = document.getElementById('preview-image');
        const previewLabel = document.getElementById('previewDiv');
        
        hideLoading();
        if (response.data && response.data.img) {
            // Set the src attribute to display the base64 image
            previewImage.src = 'data:image/png;base64,' + response.data.img;
            previewImage.style.visibility = 'visible';
            previewLabel.style.display = 'flex';
        } else {
            console.error('Invalid image data:', response.data);
            updateStatusMessage('Error generating image data.', true);
        }
        
    } catch (error) {
        console.error('Error:', error);
        hideLoading();
        updateStatusMessage('Error loading preview: ' + error, true);
    }
}


function printLabel() {
    const primaryText = document.getElementById('primaryText').value;
    const secondaryText = document.getElementById('secondaryText').value;
    const dateText = document.getElementById('dateText').value;
    const iconUrl = document.getElementById('iconUrl').value;
    const qtyText = document.getElementById('qtyText').value;

    showLoading();
    axios.post('/api/print', {
        primaryText: primaryText,
        secondaryText: secondaryText,
        dateText: dateText,
        iconUrl: iconUrl,
        qtyText: qtyText
    })
    .then(function (response) {
        hideLoading();
        if(response.data && !response.data.error){
            console.log('Print server response:', response.data);
            updateStatusMessage('Print successful!');
        } else {
            alert('Print failed: ', response.data.error);
            updateStatusMessage('Print failed: ' + response.data.error, true);
        }
        
    })
    .catch(function (error) {
        console.error('Error:', error);
        hideLoading();
        updateStatusMessage('Error sending print request.', true);
    });
}

async function searchIcons() {
   const searchTerm = document.getElementById('primaryText').value;

   showLoading()
   console.log('Searching IconFinder for:', searchTerm);
    try {
        const response = await axios.get(`api/search-icons?searchTerm=${searchTerm}`);
        const icons = response.data;
        document.getElementById('iconDiv').style.display = 'flex';
        displayIcons(icons); // Function to handle the display of icons on the frontend
    } catch (error) {
        console.error('Error fetching icons:', error);
        updateStatusMessage('Failed to load icons: ' + error, true);

    }
}

function displayIcons(icons) {
    const iconContainer = document.getElementById('iconResults');
    iconContainer.innerHTML = '';

    icons.forEach(icon => {
        const img = document.createElement('img');
        img.src = icon.previewUrl;
        img.alt = 'Icon';
        img.className = 'icon'; // Add this line
        img.addEventListener('click', () => {
            document.getElementById('iconUrl').value = icon.previewUrl.replace(/\d+(?=\.png)/, '145');
        });
        iconContainer.appendChild(img);
    });
    hideLoading();
}

function showLoading() {
    const loader = document.createElement('div');
    loader.className = 'loader';
    loader.id = 'loader';
    document.getElementById('loadingIndicator').appendChild(loader);
    document.getElementById('loadingIndicator').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loader').remove();
    document.getElementById('loadingIndicator').style.display = 'none';
}


function updateStatusMessage(message, isError = false) {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = message;
    statusMessage.style.color = isError ? 'red' : 'green';

    // Remove the fade-out class after the animation completes
    setTimeout(() => {
        statusMessage.className = 'fade-out';
    }, 4000); // Display message for 4 seconds before starting to fade out

    // Clear the message after the fade-out completes
    setTimeout(() => {
        statusMessage.className = '';
        statusMessage.textContent = ''; // Clear the text
    }, 6000); // Total duration for message visibility and fade out
}


function dateTodayFormatted() {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.toLocaleString('default', { month: 'short' });
    var yyyy = today.getFullYear();
    today = mm + ' ' + dd + ', ' + yyyy;
    return today;
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}


function startOver() {
    document.getElementById('primaryText').value = '';
    document.getElementById('secondaryText').value = '';
    document.getElementById('iconUrl').value = '';
    document.getElementById('qtyText').value = '1';
    document.getElementById('dateText').value = dateTodayFormatted();
    document.getElementById('previewDiv').style.display = 'none';
    document.getElementById('preview-image').style.visibility = 'hidden';
    document.getElementById('preview-image').src = '';
    document.getElementById('iconResults').innerHTML = '';
    document.getElementById('primaryText').focus();
}

document.addEventListener('keydown', function(event) {
    if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
            // Bind Commend+shotcuts to buttons
            case 'e':
                event.preventDefault();
                document.getElementById('previewButton').click();
                break;
            case 'p':
                event.preventDefault();
                document.getElementById('printButton').click();
                //document.getElementById('searchIconsButton').click();
                break;
            case 'i':
                event.preventDefault();
                document.getElementById('searchIconsButton').click();
                break;
            case '1':
                event.preventDefault();
                document.getElementById('primaryText').focus();
                break;
            case '2':
                event.preventDefault();
                document.getElementById('secondaryText').focus();
                break;
            case '3':
                event.preventDefault();
                document.getElementById('qtyText').focus();
                break;
            case '4':
                event.preventDefault();
                document.getElementById('dateText').focus();
                break;
            case '5':
                event.preventDefault();
                document.getElementById('iconUrl').focus();
                break;
        }
    }
});

document.getElementById('primaryText').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        searchIcons();
    }
});

document.getElementById('primaryText').addEventListener('blur', function() {
    this.value = toTitleCase(this.value);
});
