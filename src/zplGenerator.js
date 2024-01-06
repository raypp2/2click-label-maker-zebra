// Function to create ZPL
function createZPL(primaryText, secondaryText, dateText, iconZpl) {
    return `CT~~CD,~CC^~CT~
^XA~TA000~JSN^LT0^MNW^MTD^PON^PMN^LH0,0^JMA^PR3,3~SD19^JUS^LRN^CI0^XZ
^XA
^MMC
^PW448
^LL0253
^LS0
^FO15,15${iconZpl}
^FT180,125^A0N,52,48^FB265,2,5,^FD${primaryText}^FS
^FT163,185^A0N,30,38^FD${dateText}^FS
^FT163,241^ACN,18,10^FB285,2,5,^FD${secondaryText}^FS
^LRY^FO163,0^GB298,153,153^FS^LRN
^PQ1,1,1,Y^XZ`;
}

module.exports = {
	createZPL
};