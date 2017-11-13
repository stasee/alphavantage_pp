var express = require('express');
var router = express.Router();
var request = require('request');

function getChartData(symbol, market, callback) {
    request('https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY&symbol=' + symbol + '&market=' + market + '&apikey=' + process.env.apiKey, 
        function(error, result, body) {
            if (error) {
                return callback(error, null);
            } else {
                let tabledata = {};
                let jdata = JSON.parse(body);
                if (jdata.hasOwnProperty('Time Series (Digital Currency Daily)')) {
                    let jdates = jdata['Time Series (Digital Currency Daily)'];
                    for (let idx in jdates) {
                        let closefield = '4a. close (' + market + ')'
                        if (jdates[idx].hasOwnProperty(closefield)) {
                            let rowdata = {};
                            rowdata.date = idx;
                            rowdata.close = jdates[idx][closefield];
                            rowdata.market = market;
                            tabledata[idx] = rowdata;
                        }
                    }
                }
                return callback(null, tabledata);
            }
        });
}

function calcrealdata(td1, td2, market) {
    let tabledata = [];
    for (let idx in td1) {
        if (td2.hasOwnProperty(idx)) {
            let rowdata = {};
            rowdata.date = idx;
            rowdata.close = td1[idx].close * td2[idx].close;
            rowdata.market = market;
            tabledata[idx] = rowdata;
        }
    }
    return tabledata;
}

var symbols = {
    "EOS" : {
        intermarket: 'ETH'
    },
    "IOT" : {
        intermarket: 'ETH'
    }
}

function getChartData2(symbol, intermarket, market, callback) {
    
    if (symbols.hasOwnProperty(symbol)) {
        intermarket = symbols[symbol].intermarket;
    }
    if (intermarket === null) {
        return getChartData(symbol, market, callback);
    } else {
        getChartData(symbol, intermarket, function(err, tabledata1) {
            if (err)
                return callback(err);

            getChartData(intermarket, market, function(err, tabledata2) {
                if (err)
                    return callback(err);

                //calculate real values from both
                let realdata = calcrealdata(tabledata1, tabledata2, market);
                callback(null, realdata);
            });
        });
    }
}

/* GET home page. */
router.get('/table', function (req, res) {
    if (!req.query.hasOwnProperty('symbol'))
        return res.status(500).json({ error: 'missing param symbol' });
    
    let market = 'EUR';
    if (req.query.hasOwnProperty('market'))
        market = req.query.market;

    let intermarket = null;
    if (req.query.hasOwnProperty('intermarket'))
        intermarket = req.query.intermarket;
            
    getChartData2(req.query.symbol, intermarket, market, function(err, tabledata) {
        if (err)
            return res.status(500).json({ error: err });

        res.render('index', { title: 'Chart Data', tabledata: tabledata });
    });
});


module.exports = router;

/*
"{
    "Meta Data": {
        "1. Information": "Daily Prices and Volumes for Digital Currency",
        "2. Digital Currency Code": "XMR",
        "3. Digital Currency Name": "Monero",
        "4. Market Code": "EUR",
        "5. Market Name": "Euro",
        "6. Last Refreshed": "2017-11-12 (end of day)",
        "7. Time Zone": "UTC"
    },
    "Time Series (Digital Currency Daily)": {
        "2017-11-12": {
            "1a. open (EUR)": "100.65881828",
            "1b. open (USD)": "117.42855542",
            "2a. high (EUR)": "105.23423504",
            "2b. high (USD)": "122.75363363",
            "3a. low (EUR)": "92.07032075",
            "3b. low (USD)": "107.40921608",
            "4a. close (EUR)": "104.90655807",
            "4b. close (USD)": "122.34771410",
            "5. volume": "14839.33747709",
            "6. market cap (USD)": "1815559.01909582"
        },
    }
}"
*/