
module.exports = function(RED) {
const {EmberClient, EmberClientEvent, LoggingService} = require('@mikw99/node-emberplus-custom');


function EmberOut(config) {
    RED.nodes.createNode(this, config);

    const node = this;
    let flowContext = this.context().flow;
    let statMsg = {};
    const client = new EmberClient({ host: config.clientIP, port: config.emberPort, logger: new LoggingService(5), timeoutValue: 5000 });

    console.log("created client");
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

   

    //declare OSC/Ember+ Arrays
    let oscAdrFader = new Array();
    let oscAdrGain = new Array();
    let oscAdrPFL = new Array();
    let oscAdrGrp = new Array();
    let oscAdrGrpPFL = new Array();
    
    let emberAdrFader = new Array();
    let emberAdrGain = new Array();
    let emberAdrPFL = new Array();
    let emberAdrGrp = new Array();
    let emberAdrGrpPFL = new Array();

    let emberNodesFader = new Array();
    let emberNodesGain = new Array();
    let emberNodesPFL = new Array();
    let emberNodesGrp = new Array();
    let emberNodesGrpPFL = new Array();

    //let emberNodesLabel = new Array();
    //let emberAdrLabel = new Array();
    //let oscAdrLabel = new Array();

    let ignoreList = new Array();


    //declare reconnect function
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

    //verify Nodes callback function
    function verifyNodes() {
        console.log("verifying nodes");
        
        if (emberNodesFader.includes(undefined)) {
            let errorIndexFader = emberNodesFader.map((e, i) => e === undefined ? i : "").filter(String);
            console.log("Undefined Entry in emberNodesFader array at index " + errorIndexFader + ". Inject msg.topic reScan to try again.");
        }
        if (emberNodesGain.includes(undefined)) {
            let errorIndexGain = emberNodesGain.map((e, i) => e === undefined ? i : "").filter(String);
            console.log("Undefined Entry in emberNodesGain array at index " + errorIndexGain + ". Inject msg.topic reScan to try again.");
        }
        if (emberNodesPFL.includes(undefined)) {
            let errorIndexPFL = emberNodesPFL.map((e, i) => e === undefined ? i : "").filter(String);
            console.log("Undefined Entry in emberNodesPFL array at index " + errorIndexPFL + ". Inject msg.topic reScan to try again.");
        }
        if (emberNodesGrp.includes(undefined)) {
            let errorIndexGrp = emberNodesGrp.map((e, i) => e === undefined ? i : "").filter(String);
            console.log("Undefined Entry in emberNodesGrp array at index " + errorIndexGrp + ". Inject msg.topic reScan to try again.");
        }
        if (emberNodesGrpPFL.includes(undefined)) {
            let errorIndexGrpPFL = emberNodesGrpPFL.map((e, i) => e === undefined ? i : "").filter(String);
            console.log("Undefined Entry in emberNodesGrpPFL array at index " + errorIndexGrpPFL + ". Inject msg.topic reScan to try again.");
        }
    
        console.log("finished getNode operation. See log for errors.");
        statMsg.payload = "getNode complete";
        node.send([null, statMsg]);
    }

    //declare get-node function
    async function getEmberNodes(callback) {
        oscAdrFader = flowContext.get("oscDictFader");
        oscAdrGain = flowContext.get("oscDictGain");
        oscAdrPFL = flowContext.get("oscDictPFL");
        oscAdrGrp = flowContext.get("oscDictGrp");
        oscAdrGrpPFL = flowContext.get("oscDictGrpPFL");
        //oscAdrLabel= flowContext.get("oscDictLabel");
    
        emberAdrFader = flowContext.get("emberDictFader");
        emberAdrGain = flowContext.get("emberDictGain");
        emberAdrPFL = flowContext.get("emberDictPFL");
        emberAdrGrp = flowContext.get("emberDictGrp");
        emberAdrGrpPFL = flowContext.get("emberDictGrpPFL");
        //emberAdrLabel = flowContext.get("emberDictLabel");

        ignoreList = flowContext.get("ignoreListDict");

        //Label return
        /*
        if (Array.isArray(emberAdrLabel)) {
        for (let i = 0; i < emberAdrLabel.length); i+) {
        emberNodesLabel[i] = await client.getElementByPathAsync(emberAdrLabel[i], () => {
            msg.topic = oscAdrLabel[i];
            msg.payload = emberAdrLabel[i].value;
            node.send(msg);
            })
            .catch(()=> {console.log("error at Label return for " + emberAdrLabel[i])});
            }
        }
        */

        //get Faders
        if (Array.isArray(emberAdrFader)) {
        for (let i = 0; i < emberAdrFader.length; i++) {
                console.log(emberAdrFader[i]);
                emberNodesFader[i] = await client.getElementByPathAsync(emberAdrFader[i])
                .catch(()=> {console.log("error")});
                //console.log(JSON.stringify(emberNodesFader[i]));
            }
        }
        else {
            console.log("emberAdrFader is not an array or undefined");
        }
        
            //get Gain
        if (Array.isArray(emberAdrGain)) {
        for (let i = 0; i < emberAdrGain.length; i++) {
                emberNodesGain[i] = await client.getElementByPathAsync(emberAdrGain[i])
                .catch(()=> {console.log("error")});
                //console.log(JSON.stringify(emberNodesGain[i]));
                }
            }
        else {
            console.log("emberAdrGain is not an array or undefined");
            }
             
            //get PFL
        if (Array.isArray(emberAdrPFL)) {
        for (let i = 0; i < emberAdrPFL.length; i++) {
                emberNodesPFL[i] = await client.getElementByPathAsync(emberAdrPFL[i])
                .catch(()=> {console.log("error")});
                //console.log(JSON.stringify(emberNodesPFL[i]));
                }
            }
        else {
            console.log("emberAdrPFL is not an array or undefined");
        }

        console.log("starting grp scan");
        
        if (Array.isArray(emberAdrGrpPFL)) {
        for (let i = 0; i < emberAdrGrpPFL.length; i++) {
                emberNodesGrpPFL[i] = await client.getElementByPathAsync(emberAdrGrpPFL[i])
                .catch(()=> {console.log("error")});
                //console.log(JSON.stringify(emberNodesGrpPFL[i]));
                }
        }
        else {
            console.log("emberAdrGrpPFL is not an array or not defined");
        }

        if (Array.isArray(emberAdrGrp)) {
        for (let i = 0; i < emberAdrGrp.length; i++) {
                emberNodesGrp[i] = await client.getElementByPathAsync(emberAdrGrp[i])
                .catch(()=> {console.log("error")});
                //console.log(JSON.stringify(emberNodesGrp[i]));
                }
        }
        else {
            console.log("emberAdrGrp is not an array or not defined");
        }
        
        console.log("scanned all nodes");
        console.log("Nodes on ignore list: " + ignoreList);
        callback();
    }

    //declare rescan function
    async function reScan(callback) {
        console.log("rescanning nodes");
        let errorIndexFader = emberNodesFader.map((e, i) => e === undefined ? i : "").filter(String);
        let errorIndexGain = emberNodesGain.map((e, i) => e === undefined ? i : "").filter(String);
        let errorIndexPFL = emberNodesPFL.map((e, i) => e === undefined ? i : "").filter(String);
        let errorIndexGrp = emberNodesPFL.map((e, i) => e === undefined ? i : "").filter(String);
        let errorIndexGrpPFL = emberNodesPFL.map((e, i) => e === undefined ? i : "").filter(String);

        //callback hier entfernen???
        for (let i = 0; i < errorIndexFader.length; i++) {
            emberNodesFader[errorIndexFader[i]] = await client.getElementByPathAsync(emberAdrFader[errorIndexFader[i]]), () => {
                console.log(JSON.stringify(emberNodesFader[errorIndexFader[i]]));
            }
        }
        for (let i = 0; i < errorIndexGain.length; i++) {
            emberNodesGain[errorIndexGain[i]] = await client.getElementByPathAsync(emberAdrGain[errorIndexGain[i]]), () => {
                console.log(JSON.stringify(emberNodesGain[errorIndexGain[i]]));
            }
        }
        for (let i = 0; i < errorIndexPFL.length; i++) {
            emberNodesPFL[errorIndexPFL[i]] = await client.getElementByPathAsync(emberAdrPFL[errorIndexPFL[i]]), () => {
                console.log(JSON.stringify(emberNodesPFL[errorIndexPFL[i]]));
            }
        }
        for (let i = 0; i < errorIndexGrp.length; i++) {
            emberNodesGrp[errorIndexGrp[i]] = await client.getElementByPathAsync(emberAdrGrp[errorIndexGrp[i]]), () => {
                console.log(JSON.stringify(emberNodesGrp[errorIndexGrp[i]]));
            }
        }
        for (let i = 0; i < errorIndexGrpPFL.length; i++) {
            emberNodesGrpPFL[errorIndexGrpPFL[i]] = await client.getElementByPathAsync(emberAdrGrpPFL[errorIndexGrpPFL[i]]), () => {
                console.log(JSON.stringify(emberNodesGrpPFL[errorIndexGrpPFL[i]]));
            }
        }
        console.log("rescanned nodes. Verifying again.");
        callback();
    }

    /*
    //connect on startup
    this.on('open', async () => {
        await client.connectAsync()
        .catch(console.log("connection error"));      
    });
    */
   
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

    //
    //handle messages
    //
    this.on('input', async function(msg, send, done) {

        console.log("received message " + msg.topic + " " + msg.payload);
        let xosc = oscAdrFader.indexOf(msg.topic);
        let xoscGain = oscAdrGain.indexOf(msg.topic);
        let xoscPFL = oscAdrPFL.indexOf(msg.topic);
        let xoscGrp = oscAdrGrp.indexOf(msg.topic);
        let xoscGrpPFL = oscAdrGrpPFL.indexOf(msg.topic);
    
        //handle msg depending on topic
        if (msg.topic === "reconnect" && client.isConnected() === false) {
            tryReconnect();
        }

        else if (msg.topic === "get Nodes" && client.isConnected() === true) {
                //get EmberNodes
                getEmberNodes(verifyNodes);
        }

        else if (msg.topic === "reScan") {
            console.log("rescanning empty nodes");
            reScan(verifyNodes);
        }

        else if (msg.topic === "disconnect") {
            await client.disconnectAsync();
            console.log("Disconnected manually!");
        }

        //FADER
        else if (client.isConnected() === true) {

        if (xosc !== -1 && !ignoreList.includes(emberAdrFader[xosc])) {
            console.log("received Fader Value" + msg.payload);
            try {
            client.setValue(emberNodesFader[xosc], msg.payload);
            } catch(err) {
                console.log(err);
            }
            }  
                
        //GAIN
        else if (xoscGain !== -1 && !ignoreList.includes(emberAdrGain[xoscGain])) {
            console.log("received Gain Value" + msg.payload);
            try {
            client.setValue(emberNodesGain[xoscGain], msg.payload);
            } catch(err) {
                console.log(err);
            }
            } 
        
        //GRP
        else if (xoscGrp !== -1 && !ignoreList.includes(emberAdrGrp[xoscGrp])) {
            console.log("received Grp Value" + msg.payload);
            try {
            client.setValue(emberNodesGrp[xoscGrp], msg.payload);
            } catch(err) {
                console.log(err);
            }
            } 

        //PFL
        else if (xoscPFL !== -1 && !ignoreList.includes(emberAdrPFL[xoscPFL])) {
            console.log("received PFL Value" + msg.payload);

            if (msg.payload === 1) {
                msg.payload = true;
                await client.setValueAsync(emberNodesPFL[xoscPFL], msg.payload)
                .catch(() => {
                    (console.log("unable to set value"));
                });
            }
            else if (msg.payload === 0) {
                msg.payload = false;
                await client.setValueAsync(emberNodesPFL[xoscPFL], msg.payload)
                .catch(() => {
                    (console.log("unable to set value"));
                });
            }           
            else {
                (console.log("invalid PFL payload: " + msg.payload));
            }
        }

        //GRP PFL
        else if (xoscGrpPFL !== -1 && !ignoreList.includes(emberAdrGrpPFL[xoscGrpPFL])) {
                console.log("received GRP PFL Value" + msg.payload);
    
            if (msg.payload === 1) {
                msg.payload = true;
                await client.setValueAsync(emberNodesGrpPFL[xoscGrpPFL], msg.payload)
                .catch(() => {
                    (console.log("unable to set value"));
                });
            }
            else if (msg.payload === 0) {
                msg.payload = false;
                await client.setValueAsync(emberNodesGrpPFL[xoscGrpPFL], msg.payload)
                .catch(() => {
                    (console.log("unable to set value"));
                });
            }
            else {
                (console.log("invalid PFL payload: " + msg.payload));
            }
            }
        }
        
        else {
            console.log("received bad value or connection is disrupted");
        }


        if (done) {
            done();
            }
        });

    //
    //clean up on close
    //
    this.on('close', async () => {
        await client.disconnectAsync();
        console.log("disconnected");

    });
}


RED.nodes.registerType("ember-out", EmberOut);
}
