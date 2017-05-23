var WebSocketClient = require('websocket').client;
var config = require('./config.js');

var bitcoinListener = {
    "client": {},
    "config": {},
    "feedId": "",
    "reconnect": null,
    "reconnectDelay": 3000,
    "init": function(configName){
        var self = this;
        this.config = config.bitcoinFeeds[configName];
        this.feedId = configName;
        this.client = new WebSocketClient();

        this.client.on('connectFailed', function(error) {
            self.onError(error);
        });

        this.client.on('connect', function(connection) {
            this.reconnect = null;
            connection.send(JSON.stringify(self.config.subscribeOptions));
            connection.on('error', function(error) {
                self.onError(error);
            });
            connection.on('close', function() {
                self.onClose();
            });
            connection.on('message', function(message) {
                self.onMessage(message.utf8Data);
            });
        });
        this.connect();
    },
    "setReconnectTimeOut": function(){
        var self = this;
        if(!this.reconnect){
            this.reconnect = setInterval(function(){
                self.connect();
            },this.reconnectDelay);
        }
    },
    "connect": function(){
        this.client.connect(this.config.url, '');
    },
    "onError": function(error){
        this.setReconnectTimeOut();
    },
    "onClose": function(){
        this.setReconnectTimeOut();
    },
    "onMessage": function(data){
        data = this.tryParseJSON(data);
        if(data && data[this.config.priceField] && (!this.config.respCheck || this.config.respCheck(data))){
            process.send(JSON.stringify({"btcusd":data[this.config.priceField], "feedId":this.feedId}));
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

bitcoinListener.init(process.argv[2]);
