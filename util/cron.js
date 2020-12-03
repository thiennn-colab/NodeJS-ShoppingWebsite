const CronJob = require('cron').CronJob
const fs = require('fs')
const moment = require('moment')
const path = require('path')


let job = new CronJob({
    cronTime: '00 13 16 * * 0-6',
    onTick: function () {
        console.log('Running cron job')
        console.log(moment().subtract(2, 'days').format('YYYYMMDD'))
        let dirname = path.join('D:', 'Tracking-DATABASE-' + moment().subtract(2, 'days').format('YYYYMMDD'))
        fs.rmdir(dirname, (error) => {
            if (error) { 
                console.log("No such file or directory"); 
            } 
            else { 
                console.log("Directories Deleted!");
            }
        })
    }
})

module.exports = {
    job
}