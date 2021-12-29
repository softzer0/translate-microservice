/* For auto-upgrading dependencies and restarting the service
   Command: npm run cronjob */

const childProcess = require('child_process')
const createChild = () => childProcess.fork('./main.js')
let child = createChild()
const ncu = require('npm-check-updates')
new (require('cron').CronJob)('0 0 1 * *', async () => { // Every 1st of the month at 00:00
    if (!Object.keys(await ncu.run({upgrade: true})).length) return
    child.kill()
    child = createChild()
}).start()