/***/ const port = 3000
/***/ const serviceOrder = ['google', 'bing'] // Order of the services, from left to right
/*** CONFIGURATION ***/

const specialCases = { // IMPORTANT: Populate it as more services are being implemented
    google: {
        'auto': {bing: 'auto-detect'},
        'zh-cn': {bing: 'zh-Hans'}, // Chinese Simplified
        'zh-tw': {bing: 'zh-Hant'}, // Chinese Traditional
    },
    bing: {
        'fr-CA': {google: 'fr'}, // French (Canada)
        'pt-PT': {google: 'pt'}, // Portuguese (Portugal)
        'sr-Latn': {google: 'sr'}, // Serbian (Latin) - falls back to Cyrillic
        'sr-Cyrl': {google: 'sr'}, // Serbian (Cyrillic)
    }
}
const translateServices = {
    google: (text, from, to) => require('@iamtraction/google-translate').call(null, text, { from, to }),
    bing: require('bing-translate-api').translate,
}

const express = require('express')
const app = express()

Object.keys(specialCases).forEach(service => {
    for (const [name, c] of Object.entries(specialCases[service])) {
        for (const [k, v] of Object.entries(c)) {
            specialCases[k][v] = {[service]: name}
        }
    }
})
function fallbackSpecialCases (fromService, toService, fromQuery, toQuery) {
    if (specialCases[fromService]) {
        if (specialCases[fromService][fromQuery])
            fromQuery = specialCases[fromService][fromQuery][toService]
        if (specialCases[fromService][toQuery])
            toQuery = specialCases[fromService][toQuery][toService]
    }
    return {from: fromQuery, to: toQuery}
}

app.get('/', async(req, res) => { // Example: /?text=Thank you&from=en&to=es&fallback=true
    let previousService, error
    for (const service of serviceOrder) {
        const { from, to } = fallbackSpecialCases(previousService, service, req.query.from, req.query.to)
        try {
            return res.json(await translateServices[service](req.query.text, from, to))
        } catch (err) {
            console.error(err)
            error = err
            if (!req.query.fallback) break
            previousService = service
        }
    }
    res.status(400)
    res.json(error)
})

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
})