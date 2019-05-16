'use strict'

module.exports = {
    log: log,
    getIP: getIP,
    getRef: getRef,
}


let MSGS = []
function log(req, msg) {
    let dt = (new Date()).toISOString()
    let ip = getIP(req)
    MSGS.push(`[${dt}] ${ip}:${msg}`)
}

function daemon() {
    setInterval(() => {
        let m = MSGS.shift()
        if(m) console.log(m)
    }, 500)
}

function getIP(req) {
    if(req.headers['x-forwarded-for']) return req.headers['x-forwarded-for']
    if(req.connection && req.connection.remoteAddress) return req.connection.remoteAddress
    if(req.socket && req.socket.remoteAddress) req.socket.remoteAddress
    if(req.connection && req.connection.socket) return req.connection.socket.remoteAddress
}

function getRef(req) {
    return req.header('Referer')
}

daemon()
