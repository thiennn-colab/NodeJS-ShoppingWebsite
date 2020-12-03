const getSize = require('get-folder-size')
const checkDiskSpace = require('check-disk-space')
const express = require('express')
const path = require('path')
const router = express.Router()


const FCM = require('fcm-node')

var serverKey = 'AAAAB5e1ZRo:APA91bFJ3zSrL4K_BpB59HTp3eQ9e4qIU56qvo1xYVGkxuvZnw7wgaUsIir7f1qV61NsRuJvvRkubgXKM6Fc4PA62FrFgPJiKqY_nwR0lkQ_GqJs8yu7sKhMEnECBDlWgTl16MBO8ukb'; //put your server key here
var fcm = new FCM(serverKey);

router.get('/getFolderSize', (req, res, next) => {
    // console.log(path.join(__dirname, '/../'))
    // getSize(path.join(__dirname, '/../'), (err, size) => {
    //     if (err) {
    //         res.json(err)
    //     }
    //     res.json({
    //     folderSize: (size / 1024 / 1024).toFixed(2) + ' MB'
    // })
    // })
    // fcm.subscribeToTopic(['esvppioyI-UW5kLrBiiVUf:APA91bGznjMDPIAcQdgY6JNaGQqJFUK4Ggc2uCj_5R_01h5wENdmWO-nhNfy_66cVSjhDxKbY1-SWWM5zXvO0xxr_gFIhnUvh4wyg-6s803ERwrwCwJHRUlIrjJ5Y57vFaWbrJ2Yn35i'],
    //     'Thien', (err, res) => {
    //         if (err) {
    //             console.log(err)
    //         } else {
    //             console.log('haha')
    //         }
    //     });
    var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
        to: '/topics/Thien', 
        collapse_key: 'your_collapse_key',
        
        notification: {
            title: 'Title of your push notification', 
            body: 'Body of your push notification' 
        },
        
        data: {  //you can send only notification or only data(or include both)
            my_key: 'my value',
            my_another_key: 'my another value'
        }
    }
    
    fcm.send(message, function(err, response){
        if (err) {
            console.log("Something has gone wrong!")
        } else {
            console.log("Successfully sent with response: ", response)
        }
    })

})

router.get('/checkDiskSpace', (req, res, next) => {
    console.log('E:')
    checkDiskSpace('E:')
        .then(diskSpace => {
            diskSpace.free = (diskSpace.free / 1024 / 1024 / 1024).toFixed(2) + ' GB'
            diskSpace.size = (diskSpace.size / 1024 / 1024 / 1024).toFixed(2) + ' GB'
            res.json(diskSpace)
        })
})


module.exports = router