const 
    multer = require('multer'),
    path = require('path')

module.exports = {
    storage : new multer.diskStorage({
        destination : path.resolve(__dirname, "./static/","uploads"),
        filename : function(req, file, callback) {
            callback(null, file.originalname)
        }
    })
}
