var http = require("http");
var https = require("https");
var config = require('./config.js');


var exchangeListener = {
    "config": {},
    "defOptions": {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    },
    "init": function(configName){
        var self = this;
        this.config = config.exchangeFeeds[configName];
        this.feedId = configName;
        setTimeout(function(){
            self.connect(Object.assign(self.defOptions, self.config.requestOptions));
        },5000);
        self.connect(Object.assign(self.defOptions, self.config.requestOptions));
    },
    "connect": function(options){
        var self = this;
        var prot = options.port == 443 ? https : http;
        var req = prot.request(options, function(res)
        {
            var output = '';
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                output += chunk;
            });

            res.on('end', function() {
                self.onMessage(output);
            });
        });

        req.on('error', function(err) {
            self.onError(err);
        });

        req.end();
    },
    "onError": function(error){
        console.log(JSON.stringify({"error": error}));
    },
    "onClose": function(){
        this.connect();
    },
    "onMessage": function(data){
        data = this.tryParseJSON(data);
        if(data){
            data = this.config.getData(data);
            if(data){
                data.feedId = this.feedId;
                process.send(JSON.stringify(data));
            }
        }
    },
    "tryParseJSON": function(json){
        try {
            var o = JSON.parse(json);
            if (o && typeof o === "object") {
                return o;
            }
        }
        catch (e) {}
        return false;
    }
}

exchangeListener.init(process.argv[2]);
