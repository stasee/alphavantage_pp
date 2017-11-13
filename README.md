# alphavantage_pp
Converts alphavantage Crypto Charts to html tables for Portfolio Performance

Put you Alpha Vantage API Key in the 'apiKey' Environment or put it in the main.js

Launch it with node main.js

By default it listens to port 3005

Launch your browser and point it to 
http://localhost:3005/table?symbol=ETH

The result currency is market (default EUR).

You may need an intermediate currency (where the symbol is in), for example EOS is only available in ETH.
http://localhost:3005/table?symbol=EOS&intermarket=ETH&market=EUR

