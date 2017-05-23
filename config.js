var config = {
    bitcoinFeeds:{
        "bitfinex":{
            "url" : "wss://api.bitfinex.com/ws",
            "subscribeOptions" : {
                "event":"subscribe",
                "channel":"ticker",
                "pair":"BTCUSD"
            },
            "priceField" : 7,
            "respCheck" : null

        },
        "gdax":{
            "url" : "wss://ws-feed.gdax.com",
            "subscribeOptions" :  {
                "type": "subscribe",
                "product_ids": [
                    "BTC-USD"
                ]
            },
            "priceField" : "price",
            "respCheck" : function(data){
                return (data.type == "done");
            }
        }
    },
    exchangeFeeds:{
        "yahooapis":{
            "requestOptions" : {
                host: "query.yahooapis.com",
                port: 443,
                path: "/v1/public/yql?q=select%20*%20from%20yahoo.finance.xchange%20where%20pair%20in%20(%22EURUSD%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback="
            },
            "getData" : function(data){
                return {
                    "rate" : data.query.results.rate.Rate,
                    "timestamp" : new Date(data.query.results.rate.Date+" "+data.query.results.rate.Time.replace("am"," AM").replace("pm"," PM")).getTime()
                }
            }
        },
        "liverates":{
            "requestOptions" : {
                host: "www.live-rates.com",
                port: 443,
                path: "/rates"
            },
            "getData" : function(data){
                for( var i in data ){
                    if(data[i].currency=="EUR/USD"){
                        return {
                            "rate" : data[i].rate,
                            "timestamp" : data[i].timestamp
                        }
                    }
                }
            }
        }
    }
}
module.exports = config;
