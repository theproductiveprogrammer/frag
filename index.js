'use strict'
/*      outcome/
 * This is a simple web server that can:
 *  - Serve static web pages and assets
 *  - Parse POST URL and JSON requests
 *  - Save any data in '/save' requests
 *  - Ensure that every request has a unique
 *    tracking id (trid -cookie value)
 *  - If there is a 'nxt' parameter when
 *    saving data, create a redirect request
 */
const express = require('express')
const shortid = require('shortid')
const serveStatic = require('serve-static')
const path = require('path')
const fs = require('fs')


module.exports.start = function(port, src, site) {

const app = express()
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())

/*      problem/
 * Information from multiple users could interlace and we would like to
 * track them per-user.
 *
 *      way/
 * We store a random 'tracking id' (trid) cookie value for each user and
 * expose it in the request. If it's not found, we create a new one.
 */
app.use((req, res, next) => {
    let trid = req.cookies.trid
    if(!trid) {
        trid = shortid.generate()
        res.cookie('trid', trid, { maxAge: 900000 })
        console.log(`New request detected: trid=${trid}`)
    }
    req.trid = trid
    next()
})

/*      outcome/
 * Save the given data against the person id. If there is a `nxt`
 * parameter, redirect to that.
 */
app.use('/save', (req, res) => {
    let data = req.query
    if(!data) data = {}
    for(let k in req.body) {
        data[k] = req.body[k]
    }
    let nxt = data.nxt
    delete data.nxt
    let s = { trid: req.trid, data: data }
    console.log(s)
    if(nxt) res.redirect(nxt)
    else res.end()
    save(s)
})
app.use('/', serveStatic(path.join(__dirname, site)))

app.listen(port, () => console.log(`Site started on ${port}`))


function save(data) {
    let fname = getFName()
    fs.appendFile(fname, JSON.stringify(data) + '\n', (err) => {
        if(err) console.error(err)
    })
}

function getFName() {
    let now = new Date()
    let n = now.toISOString().substring(0,10)
    return n + '.log'
}

}
