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

        let x = config.lowerFader;
        let y = config.upperFader;
        
        for (let i = x; i < y; i++) {
            emberFaderArray[i] = emberFaderScheme.replace("x", i);
            oscFaderArray[i] = oscFaderScheme.replace("x", i);
        }
        flowContext.set("flowEmberDict", emberFaderArray);
        flowContext.set("flowOscDict", oscFaderArray);
        
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
