module.exports = function(RED) {
        
    function createArrays(config) {
        RED.nodes.createNode(this, config);
    
        const node = this;
        let flowContext = this.context().flow;

        node.status({ fill: "yellow", shape: "dot", text: "Enter config, then inject msg.topic 'create' to create arrays." });

        let flowEmberDict = config.emberDictAddress;
        let flowOscDict = config.oscDictAddress;

        let emberFaderArray = new Array();
        let oscFaderArray = new Array();

        let emberFaderScheme = config.emberFaderScheme;
        
        let oscFaderScheme = config.oscFaderScheme;

        function createArrays() {

        let x = parseInt(config.lowerFader);
        let y = parseInt(config.upperFader);
        let index = 0;
        
        for (let i = x; i < y; i++) {
            emberFaderArray[index] = emberFaderScheme.replace("x", i);
            oscFaderArray[index] = oscFaderScheme.replace("x", i);
            index++;
        }
        flowContext.set(config.emberDictAddress, emberFaderArray);
        flowContext.set(config.oscDictAddress, oscFaderArray);
        
        console.log("created Array " + config.emberDictAddress + " " + emberFaderArray);
        node.status({ fill: "green", shape: "dot", text: "created" });
        
        }

        this.on('input', async function(msg, send, done) {
            if (msg.topic === "create") {
                createArrays();
                
            }
        });
    }
RED.nodes.registerType("create-arrays", createArrays);
}
