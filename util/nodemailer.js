const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'nguyenngocthien024@gmail.com',
        pass: 'taoquenroi11'
    }
})

module.exports = transporter