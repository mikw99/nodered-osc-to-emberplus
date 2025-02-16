module.exports = function(RED) {
    "use strict";
    const {EmberClient, EmberClientEvent, LoggingService} = require('node-emberplus');
    
    
    function emberIn(config) {
        RED.nodes.createNode(this, config);
    
        const node = this;
        let flowContext = this.context().flow;
    
        const client = new EmberClient({ host: config.clientIP, port: config.clientPort, logger: new LoggingService(5), timeoutValue: 5000 });

        console.log("created clients");
        node.status({ fill: "yellow", shape: "dot", text: "Inject msg.topic reconnect to connect..." });
    
        client.on(EmberClientEvent.ERROR, async e => {
            console.log(e);
            console.log("Error Handler Worked");
            console.log("client connection = " + client.isConnected());
            if (e.code === "ECONNRESET") {
                console.warn("connection lost!");
                await client.disconnectAsync();
                console.log("client connection = " + client.isConnected());
                node.status({ fill: "red", shape: "dot", text: "disconnected" });
                console.warn("Please reconnect manually and get Nodes again!");
            }
        });


        //declare EmberNodes to get
        let emberInputNodes = new Array();
        let emberInputNodesPFL = new Array();
        let oscOutputPath = new Array();
        let oscOutputPathPFL = new Array();
        
        let ignoreList = new Array();

    async function tryReconnect() {

        let retryCount = 0;

        while (client.isConnected() === false && retryCount < 5) {
            retryCount++;
            await client.connectAsync()
            .catch(console.log("client could not connect. Tried " + retryCount + " times."));
        }
        if (client.isConnected() === false) {
            console.error("Couldn't reconnect in 5 tries. Inject msg.topic 'reconnect' to try again.");
        }
    }

    async function oscFader() {
        emberInputNodes = flowContext.get("emberInputDict");
        oscOutputPath = flowContext.get("oscOutputDict");
        
        for (let i; i < emberInputNodes.length; i++) {
            
            await client.getElementByPathAsync(emberInputNodes[i], () => {
                let oscMsg = {};

                oscMsg.topic = oscOutputPath[i];
                oscMsg.payload = emberInputNodes[i].value;

                node.send(oscMsg);
            });
        }
    }

    async function oscPFL() {
        emberInputNodesPFL = flowContext.get("emberInputPFLDict");
        oscOutputPathPFL = flowContext.get("oscOutputPFLDict");
        
        for (let i; i < emberInputNodes.length; i++) {
            
            await client.getElementByPathAsync(emberInputNodesPFL[i], () => {
                let oscMsg = {};
                let pflConv;
                if (emberInputNodesPFL[i].value === true) {
                    pflConv = 1;
                }
                else if (emberInputNodesPFL[i].value === true) {
                    pflConv = 0;
                }
                else {
                    console.log("received bad pfl value");
                }

                oscMsg.topic = oscOutputPath[i];
                oscMsg.payload = pflConv;

                node.send(oscMsg);
            });
        }
    }

        //signal connection
        client.on(EmberClientEvent.CONNECTED, async () => {
            console.log("Connected!");
            node.status({ fill: "green", shape: "dot", text: "connected" });
        });
    
        //automatically try to reconnect
        client.on(EmberClientEvent.DISCONNECTED, async () => {    
            console.log("Disconnected.");
            node.status({ fill: "red", shape: "dot", text: "disconnected" }); 
        });
    

    this.on('input', async function(msg, send, done) { 

        if (msg.topic === "reconnect" && client.isConnected() === false) {
            tryReconnect();
        }

        if (msg.topic === "get Nodes" && client.isConnected() === true) {
            oscFader();
            oscPFL();
        }

    });
    
    //clean up on close
    this.on('close', async () => {
        await client.disconnectAsync();
        console.log("disconnected");
    });
}

    RED.nodes.registerType("ember-in", emberIn);
}