'use strict'
const fs = require('fs')
const path = require('path')

/*      problem/
 * We need to check the src folder for updates periodically without
 * overwhelming the CPU and without making someone wait too long for the
 * update.
 *
 *      outcome/
 * Start by generating updates. If there are any, check every 2 seconds
 * for 10 minutes, then every 15 seconds for 10 minutes, then every 30
 * seconds for every 10 minutes, then every 2 minutes.
 * While this is a little frustrating - it can take a while for the
 * first change to reflect - it may work out well in practice.
 */
let TWOMINS = 2 * 60 * 1000
let TWOSECS = 2 * 1000
let FIFTEENSECS = 15 * 1000
let THIRTYSECS = 30 * 1000
let TENMINS = 10 * 60 * 1000
let TWENTYMINS = 20 * 60 * 1000
let THIRTYMINS = 30 * 60 * 1000
let GENERATED = true
let STARTPERIOD = Date.now()
let TIMEOUT = TWOMINS
function gen(src, dst, cb) {
    gen_folder(src, dst, (err) => {
        if(err) {
            cb(err)
            TIMEOUT = TWOMINS
        } else {
            if(GENERATED) {
                TIMEOUT = TWOSECS
                STARTPERIOD = Date.now()
                GENERATED = false
            } else if(TIMEOUT != TWOMINS) {
                let dur = Date.now() - STARTPERIOD
                if(dur > TENMINS) TIMEOUT = FIFTEENSECS
                if(dur > TWENTYMINS) TIMEOUT = THIRTYSECS
                if(dur > THIRTYMINS) TIMEOUT = TWOMINS
            }
        }

        setTimeout(() => {
            gen(src, dst, cb)
        }, TIMEOUT)
    })
}

/*      outcome/
 * Walk the given source folder and generate it's corresponding entries
 * into the destination (creating the destination if needed).
 */
function gen_folder(src, dst, cb) {
    fs.readdir(src, { withFileTypes: true }, (err, files) => {
        if(err) cb(err)
        else {
            fs.mkdir(dst, { recursive: true }, (err) => {
                if(err) cb(err)
                else gen_ndx_1(0, files, cb)
            })
        }
    })

    function gen_ndx_1(ndx, files, cb) {
        if(ndx >= files.length) return cb()

        let f = files[ndx]
        let psrc = path.join(src, f.name)
        let pdst = path.join(dst, f.name)
        if(f.isDirectory()) gen_folder(psrc, pdst, then_1)
        else if(f.isFile()) gen_file(psrc, pdst, then_1)


        function then_1(err) {
            if(err) cb(err)
            else gen_ndx_1(ndx+1, files, cb)
        }
    }
}

/*      outcome/
 * For HTML files (except temporary hidden files and _layout.html), we
 * we need to generate a newer version of the destination if needed.
 */
function gen_file(psrc, pdst, cb) {
    if(ignore_1(psrc)) return cb()
    newer_gen_required_1(psrc, pdst, (err, yn) => {
        if(err) cb(err)
        else {
            if(yn) {
                GENERATED = true
                generate(psrc, pdst, cb)
            }
            else cb()
        }
    })

    /*      outcome/
     * We need to generate a new file if the file change time (or the
     * _layout.html) is newer than the generated file (or the generated
     * file does not exist)
     */
    function newer_gen_required_1(psrc, pdst, cb) {
        fs.stat(pdst, (err, stat) => {
            if(err && err.code == 'ENOENT') return cb(null, true)
            if(err) return cb(err)

            let dtime = Math.max(stat.ctimeMs, stat.mtimeMs)

            fs.stat(psrc, (err, stat) => {
                if(err) return cb(err)
                let stime = Math.max(stat.ctimeMs, stat.mtimeMs)
                if(stime > dtime) return cb(null, true)

                fs.stat(layout_file(psrc), (err, stat) => {
                    if(err && err.code == 'ENOENT') return cb()
                    if(err) return cb(err)
                    let ltime = Math.max(stat.ctimeMs, stat.mtimeMs)
                    return cb(null, ltime > dtime)
                })

            })

        })
    }


    /*      outcome/
     * Ignore Non-html files, hidden files, and the special
     * `_layout.html` file
     */
    function ignore_1(fname) {
        if(!fname.endsWith(".html") &&
            !fname.endsWith(".htm")) return true

        let name = path.basename(fname)
        if(name[0] == '.') return true
        if(name == '_layout.html') return true
        return false
    }
}

function layout_file(src) {
    return path.join(path.dirname(src), '_layout.html')
}

/*      outcome/
 * Save the file to the destination, applying the layout if any.
 */
function generate(psrc, pdst, cb) {
    console.log(`Generating ${pdst} from ${psrc}...`)
    fs.readFile(layout_file(psrc), 'utf8', (err, data) => {
        if(err && err.code == 'ENOENT') {
            fs.copyFile(psrc, pdst, cb)
        } else {
            gen_1(data, psrc, pdst, cb)
        }
    })

    /*      outcome/
     * Read the source file and extract any explicit parameters (the
     * first few lines can contain name-value pairs)
     *      TITLE= My Web Page
     *      AUTHOR = James Patterson
     * while saving the rest as the CONTENT parameter.
     * Then replace the `$$<PARAMETER>$$` in the layout data to generate
     * the destination file.
     */
    function gen_1(layout, psrc, pdst, cb) {
        fs.readFile(psrc, 'utf8', (err, data) => {
            if(err) cb(err)
            else {
                let p = get_params_1(data)
                let g = set_params_1(p, layout)
                fs.writeFile(pdst, g, cb)
            }
        })
    }

    /*      outcome/
     * Check if the first line is a name-value parameter and consume
     * them and then use the rest as the 'CONTENT' parameter
     */
    function get_params_1(data) {
        let rx = /^([ \t\n\r]*[-._A-Za-z0-9]*)[\t\s]*=(.*)[\r\n]/
        let m = data.match(rx)
        let p = {}
        while(m) {
            let name = m[1].trim()
            let value = m[2].trim()
            p[name] = value
            data = data.trimLeft()
            let n = data.search(/[\r\n]/)
            if(n > 0) data = data.substring(n)
            else break
            m = data.match(rx)
        }
        p.CONTENT = data
        return p
    }

    /*      outcome/
     * Substitute each parameter in the layout data by finding and
     * replacing the given parameter.
     */
    function set_params_1(p, layout) {
        for(let k in p) {
            let pat = '$$' + k + '$$'
            let loc = layout.indexOf(pat)
            while(loc >= 0) {
                layout = layout.replace(pat, p[k])
                loc = layout.indexOf(pat)
            }
        }
        return layout
    }

}

module.exports.gen = gen
