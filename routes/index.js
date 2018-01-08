var express = require('express');
var router = express.Router();
var request = require('request');

//Last Loaded CMC Data
var CMCData = [];
//Last time the CMC Data was loaded
var CMCDataTime = 0;
//flag if CMC Update is running
var CMCDataUpdateRunning = false;

/*
var CMCData = [
    {
        "id": "bitcoin", 
        "name": "Bitcoin", 
        "symbol": "BTC", 
        "rank": "1", 
        "price_usd": "16826.5", 
        "price_btc": "1.0", 
        "24h_volume_usd": "16152800000.0", 
        "market_cap_usd": "282476753318", 
        "available_supply": "16787612.0", 
        "total_supply": "16787612.0", 
        "max_supply": "21000000.0", 
        "percent_change_1h": "-1.37", 
        "percent_change_24h": "-0.64", 
        "percent_change_7d": "25.41", 
        "last_updated": "1515328760", 
        "price_eur": "13986.52333", 
        "24h_volume_eur": "13426530416.0", 
        "market_cap_eur": "234800326893"
    }
]
*/

function updateCMCData(callback) {
    var d = new Date();
    var n = d.getTime();
    //Update every 60 seconds
    if (n > CMCDataTime + 1000 * 60) {
        if (CMCDataUpdateRunning) {
            setTimeout(updateCMCData, 20, callback);
            return;
        }
        CMCDataUpdateRunning = true;
        request('https://api.coinmarketcap.com/v1/ticker/?convert=EUR&limit=2000', 
        function(error, result, body) {
            CMCDataUpdateRunning = false;
            if (error) {
                return callback(error, null);
            } else {
                let tabledata = {};
                CMCData = JSON.parse(body);
                CMCDataTime = n;
                return callback(null);
            }
        });
    } else {
        return callback(null);
    }
}


function getChartDataTableFromAlpha(symbol, market, callback) {

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

function getChartDataDayFromAlpha(symbol, market, callback) {

    request('https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_INTRADAY&symbol=' + symbol + '&market=' + market + '&apikey=' + process.env.apiKey, 
        function(error, result, body) {
            if (error) {
                return callback(error, null);
            } else {
                let tabledata = {};
                let jdata = JSON.parse(body);
                if (jdata.hasOwnProperty('Time Series (Digital Currency Intraday)')) {
                    let jdates = jdata['Time Series (Digital Currency Intraday)'];
                    for (let idx in jdates) {
                        let closefield = '1a. price (' + market + ')'
                        if (jdates[idx].hasOwnProperty(closefield)) {
                            let dt = idx.substr(0, 10);
                            let rowdata = {};
                            rowdata.date = dt;
                            rowdata.close = jdates[idx][closefield];
                            rowdata.market = market;
                            tabledata[dt] = rowdata;
                            //just take the last
                            break;
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

function getChartDataTable(symbol, intermarket, market, callback) {
    
    if (symbols.hasOwnProperty(symbol)) {
        intermarket = symbols[symbol].intermarket;
    }
    if (intermarket === null) {
        return getChartDataTableFromAlpha(symbol, market, callback);
    } else {
        getChartDataTableFromAlpha(symbol, intermarket, function(err, tabledata1) {
            if (err)
                return callback(err);

                getChartDataTableFromAlpha(intermarket, market, function(err, tabledata2) {
                if (err)
                    return callback(err);

                //calculate real values from both
                let realdata = calcrealdata(tabledata1, tabledata2, market);
                callback(null, realdata);
            });
        });
    }
}

function getChartDataDay(symbol, intermarket, market, callback) {
    
    updateCMCData(function(err) {
        if (err)
            return callback(err);

        let tabledata = {};
        for (let idx in CMCData) {
            if (symbol === 'BTG' && CMCData[idx].id == 'bitcoin-gold') {
                let dt = new Date(parseInt(CMCData[idx].last_updated) * 1000);
                let dtstring = dt.getDate() + "." + (dt.getMonth() + 1) + "." + dt.getFullYear();
                let rowdata = {};
                rowdata.date = dtstring;
                rowdata.close = CMCData[idx].price_eur.replace(".", ",");
                rowdata.market = market;
                tabledata[dtstring] = rowdata;        
            }
            else if (symbol != 'BTG' && CMCData[idx].symbol === symbol) {
                let dt = new Date(parseInt(CMCData[idx].last_updated) * 1000);
                let dtstring = dt.getDate() + "." + (dt.getMonth() + 1) + "." + dt.getFullYear();
                let rowdata = {};
                rowdata.date = dtstring;
                rowdata.close = CMCData[idx].price_eur.replace(".", ",");
                rowdata.market = market;
                tabledata[dtstring] = rowdata;        
            }
        }
        return callback(null, tabledata);
    });
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
    
        //alphavantage table not available at the moment...getChartDataTable
    getChartDataDay(req.query.symbol, intermarket, market, function(err, tabledata) {
        if (err)
            return res.status(500).json({ error: err });

        res.render('table', { title: 'Chart Data', tabledata: tabledata });
    });
});

router.get('/', function (req, res) {
    res.render('index', { title: 'Chart Data' });
});

router.get('/day', function (req, res) {
    if (!req.query.hasOwnProperty('symbol'))
        return res.status(500).json({ error: 'missing param symbol' });
    
    let market = 'EUR';
    if (req.query.hasOwnProperty('market'))
        market = req.query.market;

    let intermarket = null;
    if (req.query.hasOwnProperty('intermarket'))
        intermarket = req.query.intermarket;
            
    getChartDataDay(req.query.symbol, intermarket, market, function(err, tabledata) {
        if (err)
            return res.status(500).json({ error: err });

        res.render('day', { title: 'Day Chart Data', symbol: req.query.symbol, tabledata: tabledata });
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