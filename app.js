var config = require('./config.js');
var cp = require('child_process');
var btcList = {};
var excList = {};
var activeFeeds = {};
var result = {
    "btcusd":1,
    "eurusd":1,
    "activeBtc":0,
    "activeExc":0,
    "excTimestamp":0,
};
var inactiveTime = 10000;

//bitcoin feeds
for(var i in config.bitcoinFeeds){
    btcList[i]={
        "process": cp.fork(`${__dirname}/bitcoinListener.js`,[i]),
    }
    btcList[i].process.on('message', (m) => {
        var data = JSON.parse(m);

        if(data.feedId){
            if(!activeFeeds[data.feedId]){
                activeFeeds[data.feedId] = {
                    "active":1,
                    "lastTime":new Date().getTime(),
                    "type": "btc"
                }
                recalculateActive();
            }else{
                activeFeeds[data.feedId].lastTime = new Date().getTime();
            }
        }

        if(data.btcusd){
            result.btcusd = parseFloat(data.btcusd).toFixed(4);
            render();
        }
    });
}

//currency feeds
for(var i in config.exchangeFeeds){
    excList[i]={
        "process": cp.fork(`${__dirname}/exchangeListener.js`,[i]),
    }
    excList[i].process.on('message', (m) => {
        var data = JSON.parse(m);

        if(data.feedId){
            if(!activeFeeds[data.feedId]){
                activeFeeds[data.feedId] = {
                    "active":1,
                    "lastTime":new Date().getTime(),
                    "type": "exc"
                }
                recalculateActive();
            }else{
                activeFeeds[data.feedId].lastTime = new Date().getTime();
            }
        }

        if(data.timestamp && data.timestamp*1 > result.excTimestamp*1){
            result.excTimestamp = data.timestamp;
            result.eurusd = parseFloat(data.rate).toFixed(4);
            render();
        }
    });
}

function render(){
    if(result["activeBtc"] > 0 && result["activeExc"] > 0){
        console.log(
            "BTC/USD: "+result["btcusd"]+
            " EUR/USD: "+result["eurusd"]+
            " BTC/EUR: "+(result["btcusd"]*1/result["eurusd"]*1).toFixed(4)+
            " Active sources: BTC/USD ("+result["activeBtc"]+" of "+Object.keys(config.bitcoinFeeds).length+") "+
            " EUR/USD ("+result["activeExc"]+" of "+Object.keys(config.exchangeFeeds).length+")"
        );
    }else{
        console.log("Not available feeds.");
    }
}

//check inactive/active
function activeCheck(){
    var changed = false;
    for(var i in activeFeeds){
        if(activeFeeds[i].lastTime < (new Date().getTime() - inactiveTime) && activeFeeds[i].active == 1){
            activeFeeds[i].active=0;
            changed = true;
        }
        if(activeFeeds[i].lastTime > (new Date().getTime() - inactiveTime) && activeFeeds[i].active == 0){
            activeFeeds[i].active=1;
            changed = true;
        }
    }
    return changed;
}

function recalculateActive(){
     var btcActiveFeeds = 0, excActiveFeeds = 0;
     for(var i in activeFeeds){
         if(activeFeeds[i].active == 1){
             if(activeFeeds[i].type == "btc"){
                 btcActiveFeeds++;
             }else{
                 excActiveFeeds++;
             }
         }
     }
     result["activeBtc"] = btcActiveFeeds;
     result["activeExc"] = excActiveFeeds;
     render();
}

setTimeout(function(){
    if(activeCheck()){
        recalculateActive();
    }
},1000);
