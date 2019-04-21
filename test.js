'use strict'
const frag = require('.')

const port = 3003

frag.start(port, 'test', 'public', 'data', (err) => {
    if(err) console.error(err)
    else console.log(`Server started on ${port}`)
})
