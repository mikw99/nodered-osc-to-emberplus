module.exports = function(RED) {
        
    function CreateArrays(config) {
        RED.nodes.createNode(this, config);
    
        const node = this;
        let flowContext = this.context().flow;

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
        emberFaderArray = flowContext.set(flowEmberDict);
        oscFaderArray = flowContext.set(flowOscDict);
        
        console.log("created Arrays");
        
        }

        this.on('input', async function(msg, send, done) {
            if (msg.topic === "create") {
                createArrays();
                
            }
        });
    }

}
