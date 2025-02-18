module.exports = function(RED) {
    "use strict";
    const {EmberClient, EmberClientEvent, LoggingService} = require('node-emberplus');
    
    
    function EmberX(config) {
        RED.nodes.createNode(this, config);
    
        const node = this;
        let flowContext = this.context().flow;
        let statMsg = {};
    
        const client_1 = new EmberClient({ host: config.clientIP_1, port: config.clientPort_1, logger: new LoggingService(5), timeoutValue: 5000 });
        const client_2 = new EmberClient({ host: config.clientIP_2, port: config.clientPort_2, logger: new LoggingService(5), timeoutValue: 5000 });

        console.log("created clients");
        node.status({ fill: "yellow", shape: "dot", text: "Inject msg.topic reconnect to connect..." });
        statMsg.topic = "status " + config.name;
        statMsg.payload = "ready to connect";
        node.send(statMsg);
    
        client_1.on(EmberClientEvent.ERROR, async e => {
            console.log(e);
            console.log("Error Handler Worked");
            console.log("client_1 connection = " + client_1.isConnected());
            if (e.code === "ECONNRESET") {
                console.warn("connection lost!");
                await client.disconnectAsync();
                console.log("client connection = " + client_1.isConnected());
                node.status({ fill: "red", shape: "dot", text: "client 1 disconnected" });
                statMsg.topic = "status " + config.name;
                statMsg.payload = "client 1 disconnected";
                node.send(statMsg);
                console.warn("Please reconnect manually and get Nodes again!");
            }
        });

        client_2.on(EmberClientEvent.ERROR, async e => {
            console.log(e);
            console.log("Error Handler Worked");
            console.log("client_2 connection = " + client_2.isConnected());
            if (e.code === "ECONNRESET") {
                console.warn("connection lost!");
                await client_2.disconnectAsync();
                console.log("client_2 connection = " + client_2.isConnected());
                node.status({ fill: "red", shape: "dot", text: "client 2 disconnected" });
                statMsg.topic = "status " + config.name;
                statMsg.payload = "client 2 disconnected";
                node.send(statMsg);
                console.warn("Please reconnect manually and get Nodes again!");
            }
        });

        //declare EmberNodes to get
        let emberInputNodes = new Array();
        let emberOutputNodes = new Array();
        let ignoreList = new Array();

    async function tryReconnect() {

        let retryCount = 0;
        const reconnectInterval = 3000;

        while (client_1.isConnected() === false && retryCount < 5) {
            retryCount++;
            await client_1.connectAsync()
            .catch(() => {
                console.error("connection error client 1" + retryCount);
                new Promise(resolve => setTimeout(resolve, reconnectInterval));      
                });
        }
        if (client_1.isConnected() === false) {
            console.error("Couldn't reconnect client 1 in 5 tries. Inject msg.topic 'reconnect' to try again.");
        }

        retryCount = 0;
        while (client_2.isConnected() === false && retryCount < 5) {
            retryCount++;
            await client_2.connectAsync()
            .catch(() => {
                console.error("connection error client 2" + retryCount);
                new Promise(resolve => setTimeout(resolve, reconnectInterval));      
                });
        }
        if (client_2.isConnected() === false) {
            console.error("Couldn't reconnect client 2 in 5 tries. Inject msg.topic 'reconnect' to try again.");
        }
        

    }

    async function bridgeNodes() {
        console.log("started bridgeNode function");
        emberInputNodes = flowContext.get("emberInputDict");
        emberOutputNodes = flowContext.get("emberOutputDict");
        
        for (let i = 0; i < emberInputNodes.length; i++) {

            console.log("asked for embernode" + emberInputNodes[i]);
            await client_1.getElementByPathAsync(emberInputNodes[i], () => {
                client_2.setValue(emberOutputNodes[i], emberInputNodes[i].value);
            });
        }
    }

    //signal connection
    client_1.on(EmberClientEvent.CONNECTED, async () => {
        console.log("Client 1 Connected!");
        if (client_1.isConnected() === true && client_2.isConnected() === true) {
           node.status({ fill: "green", shape: "dot", text: "Both clients connected" });
           statMsg.topic = "status " + config.name;
           statMsg.payload = "Both clients connected";
           node.send(statMsg);
        }
    });    
       
    client_1.on(EmberClientEvent.DISCONNECTED, async () => {    
        console.log("Client 1 Disconnected.");
        node.status({ fill: "red", shape: "dot", text: "client 1 disconnected" });  
        statMsg.topic = "status " + config.name;
        statMsg.payload = "Client 1 disconnected";
        node.send(statMsg);   
    });

    client_2.on(EmberClientEvent.CONNECTED, async () => {
        console.log("Client 2 Connected!");
        if (client_1.isConnected() === true && client_2.isConnected() === true) {
            node.status({ fill: "green", shape: "dot", text: "Both clients connected" });
            statMsg.topic = "status " + config.name;
            statMsg.payload = "Both client connected";
            node.send(statMsg);
            }
    });

    client_2.on(EmberClientEvent.DISCONNECTED, async () => {    
        console.log("Client 2 Disconnected.");
        node.status({ fill: "red", shape: "dot", text: "client 2 disconnected" });  
        statMsg.topic = "status " + config.name;
        statMsg.payload = "Client 2 disconnected";
        node.send(statMsg);
    });

    this.on('input', async function(msg, send, done) { 

        if (msg.topic === "reconnect" && (client_1.isConnected() === false || client_2.isConnected() === false)) {
            tryReconnect();
        }

        if (msg.topic === "get Nodes" && client_1.isConnected() === true && client_2.isConnected() === true) {
            bridgeNodes();
        }

    });

    //clean up on close
    this.on('close', async () => {
        await client_1.disconnectAsync();
        await client_2.disconnectAsync();
        console.log("disconnected");
    });
}

    RED.nodes.registerType("ember-x", EmberX);
}
