# alphavantage_pp
Create html tabes (Crypto Charts) for Portfolio Performance.
At the moment, the alphavantage API has changed, the code takes only the current values from 
coinmarketcap.com to present it as html table.

alphavantange is currently not used any more.

No more neccessary (at the moment):
Put your Alpha Vantage API Key in the 'apiKey' Environment or put it in the main.js
You may also create a file 'local_config.js' with the following content: process.env.apiKey = 'myAPIKey';

Do not forget to npm install
Launch it with node main.js

By default it listens to port 3005

Launch your browser and point it to 
http://localhost:3005/table?symbol=ETH

The result currency is market (default EUR).

You may need an intermediate currency (where the symbol is in), for example EOS is only available in ETH.
http://localhost:3005/table?symbol=EOS&intermarket=ETH&market=EUR

