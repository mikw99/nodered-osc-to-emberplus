module.exports = function(RED) {
    "use strict";
    const {EmberClient, EmberClientEvent, LoggingService} = require('@mikw99/node-emberplus-custom');
    
    
    function emberIn(config) {
        RED.nodes.createNode(this, config);
    
        const node = this;
        let flowContext = this.context().flow;
        let statMsg = {};
        let t_out = config.clientTimeOut;
        const client = new EmberClient({ host: config.clientIP, port: config.clientPort, logger: new LoggingService(5), timeoutValue: 5000 });

        console.log("created clients");
        node.status({ fill: "yellow", shape: "dot", text: "Inject msg.topic reconnect to connect..." });
        statMsg.topic = "status " + config.name;
        statMsg.payload = "ready to connect";
        node.send([null, statMsg]);
    
        client.on(EmberClientEvent.ERROR, async e => {
            console.log(e);
            console.log("Error Handler Worked");
            console.log("client connection = " + client.isConnected());
            if (e.code === "ECONNRESET") {
                console.warn("connection lost!");
                await client.disconnectAsync();
                console.log("client connection = " + client.isConnected());
                node.status({ fill: "red", shape: "dot", text: "disconnected" });
                statMsg.topic = "status " + config.name;
                statMsg.payload = "disconnected";
                node.send([null, statMsg]);
                console.warn("Please reconnect manually and get Nodes again!");
            }
        });


        //declare EmberNodes to get
        let emberInputNodes = new Array();
        let emberInputNodesPFL = new Array();
        let oscOutputPath = new Array();
        let oscOutputPathPFL = new Array();

        let emberInputNodesGrp = new Array();
        let emberInputNodesGrpPFL = new Array();
        let oscOutputPathGrp = new Array();
        let oscOutputPathGrpPFL = new Array();

        let emberNodesFader = new Array();
        let emberNodesGrp = new Array();
        let emberNodesPFL = new Array();
        let emberNodesGrpPFL = new Array();
        
        let ignoreList = new Array();

    async function tryReconnect() {
        console.log("Trying to reconnect.");
        let retryCount = 0;
        const reconnectInterval = 3000;
        
        while (client.isConnected() === false && retryCount < 5) {
        retryCount++;
        node.status({ fill: "yellow", shape: "dot", text: "connection pending..." });
        statMsg.topic = "status " + config.name;
        statMsg.payload = "connection pending";
        node.send([null, statMsg]);
        
        await client.connectAsync().catch(() => {
                console.error("connection error" + retryCount);
                new Promise(resolve => setTimeout(resolve, reconnectInterval));      
                }
            );

        //break;

        } 
        if (client.isConnected() === false) {
            console.error("Couldn't reconnect in 5 tries. Inject msg.topic 'reconnect' to try again.");
        }
    }

    async function oscFader() {
        console.log("started Fader function");

        emberInputNodes = flowContext.get("emberInputDict");
        oscOutputPath = flowContext.get("oscOutputDict");
        emberInputNodesGrp = flowContext.get("emberInputDictGrp");
        oscOutputPathGrp = flowContext.get("oscOutputDictGrp");

        statMsg.topic = "status" + config.name;
        statMsg.payload = "started Fader input";
        node.send([null, statMsg]);
        
        if (Array.isArray(emberInputNodes)) {
        for (let i = 0; i < emberInputNodes.length; i++) {
            
            console.log("asked for embernode" + emberInputNodes[i]);
            
            emberNodesFader[i] = await client.getElementByPathAsync(emberInputNodes[i], () => {
               
                let oscMsg = {};

                oscMsg.topic = oscOutputPath[i];
                oscMsg.payload = emberNodesFader[i].value;

                node.send(oscMsg);
            });
        }
    }

    if (Array.isArray(emberInputNodesGrp)) {
        for (let i = 0; i < emberInputNodesGrp.length; i++) {
            
            console.log("asked for Grp embernode" + emberInputNodesGrp[i]);
            
            emberNodesGrp[i] = await client.getElementByPathAsync(emberInputNodesGrp[i], () => {
               
                let oscMsg = {};

                oscMsg.topic = oscOutputPathGrp[i];
                oscMsg.payload = emberNodesGrp[i].value;

                node.send(oscMsg);
            });
        }
    }
    }

    async function oscPFL() {
        console.log("started PFL function");

        emberInputNodesPFL = flowContext.get("emberInputPFLDict");
        oscOutputPathPFL = flowContext.get("oscOutputPFLDict");
        emberInputNodesGrpPFL = flowContext.get("emberInputDictGrpPFL");
        oscOutputPathGrpPFL = flowContext.get("oscOutputDictGrpPFL");
        statMsg.topic = "status" + config.name;

        statMsg.payload = "started PFL input";
        node.send([null, statMsg]);
        
        if (Array.isArray(emberInputNodesPFL)) {
        for (let i = 0; i < emberInputNodesPFL.length; i++) {
            
            console.log("asked for PFL embernode" + emberInputNodesPFL[i]);
            
            emberNodesPFL[i] = await client.getElementByPathAsync(emberInputNodesPFL[i], () => {
                let oscMsg = {};
                let pflConv;
                if (emberNodesPFL[i].value === true) {
                    pflConv = 1;
                }
                else if (emberNodesPFL[i].value === true) {
                    pflConv = 0;
                }
                else {
                    console.log("received bad pfl value");
                }

                oscMsg.topic = oscOutputPathPFL[i];
                oscMsg.payload = pflConv;

                node.send(oscMsg);
            });
        }
    }

    if (Array.isArray(emberInputNodesGrpPFL)) {
        for (let i = 0; i < emberInputNodesGrpPFL.length; i++) {
            
            console.log("asked for Grp PFL embernode" + emberInputNodesGrpPFL[i]);
            
            emberNodesGrpPFL[i] = await client.getElementByPathAsync(emberInputNodesGrpPFL[i], () => {
                let oscMsg = {};
                let pflConv;
                if (emberNodesGrpPFL[i].value === true) {
                    pflConv = 1;
                }
                else if (emberNodesGrpPFL[i].value === true) {
                    pflConv = 0;
                }
                else {
                    console.log("received bad pfl value");
                }

                oscMsg.topic = oscOutputPathGrpPFL[i];
                oscMsg.payload = pflConv;

                node.send(oscMsg);
            });
        }
    }
    }

        //signal connection
        client.on(EmberClientEvent.CONNECTED, async () => {
            console.log("Connected!");
            node.status({ fill: "green", shape: "dot", text: "connected" });
            statMsg.topic = "status " + config.name;
            statMsg.payload = "connected";
            node.send([null, statMsg]);
        });
    
        //automatically try to reconnect
        client.on(EmberClientEvent.DISCONNECTED, async () => {    
            console.log("Disconnected.");
            node.status({ fill: "red", shape: "dot", text: "disconnected" }); 
            statMsg.topic = "status " + config.name;
            statMsg.payload = "disconnected";
            node.send([null, statMsg]);
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
