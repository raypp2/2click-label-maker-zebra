const labelConfigs = {
    Food: {
        maxWidth: 145,
        rotate: false,
        labelId: 'd90422802ec842a39c21f84023f4a82d',
        zplTemplate: (primaryText, secondaryText, dateText, iconZpl) => {
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
    },
    Box: {
        maxWidth: 300,
        rotate: true,
        labelId: '7bb437a24a4c4ba1a65c0f8483904f8e',
        zplTemplate: (primaryText, secondaryText, dateText, iconZpl) => {
            return `CT~~CD,~CC^~CT~
            ^XA~TA000~JSN^LT0^MNW^MTD^PON^PMN^LH0,0^JMA^PR3,3~SD9^JUS^LRN^CI0^XZ
            ^XA
            ^MMC
            ^PW400
            ^LL0812
            ^LS0
            ^FO64,512${iconZpl}
            
            ^FT230,480^A0B,96,96^FH\^FB460,2,5,^FD${primaryText}^FS
            
            ^FT330,480^A0B,24,24^FH\^FB460,2,5,^FD${secondaryText}^FS
            
            ^FT351,480^A0B,24,24^FH\^FD^FS
            ^PQ1,1,1,Y^XZ`;
        }
    },
    Jewelry: {
        maxWidth: 145,
        rotate: true,
        labelId: 'edb979830a1745c681163bc307921e08',
        /*
        zplTemplate: (primaryText) => {
            return `CT~~CD,~CC^~CT~
            ^XA~TA000~JSN^LT0^MNW^MTD^PON^PMN^LH0,0^JMA^PR3,3~SD9^JUS^LRN^CI0^XZ
            ^XA
            ^MMC
            ^PW447
            ^LL102
            ^LS0
            ^FT298,45^A0N,28,28^FH\^CI28^FD${primaryText}^FS^CI27
            ^FT11,45^A0N,28,28^FH\^CI28^FD${primaryText}^FS^CI27          
            ^PQ1,1,1,Y
            ^XZ`;
        }
        */
        zplTemplate: (primaryText) => {
            return `CT~~CD,~CC^~CT~
            ^XA~TA000~JSN^LT0^MNW^MTD^PON^PMN^LH0,0^JMA^PR3,3~SD9^JUS^LRN^CI0^XZ
            ^XA
            ^MMC
            ^PW447 ; 2.2 in @ 203 dpi => 2.2*203 ≈ 447 dots
            ^LS0
            ^LT0
            ^CI28
            ^FT298,45^A0N,28,28^FH\^CI28^FD${primaryText}^FS^CI27
            ^FT11,45^A0N,28,28^FH\^CI28^FD${primaryText}^FS^CI27          
            ^PQ1
            ~TA75
            ^XZ`;
        }
    }
    
};

module.exports = labelConfigs;
