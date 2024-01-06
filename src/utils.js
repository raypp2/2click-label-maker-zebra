// Function to format date
function formatDate() {
    const date = new Date();
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

module.exports = {
	formatDate
};