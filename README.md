# nodered-osc-to-emberplus
A specialized node to bridge a limited range of osc commands to a lawo console.\
Last output of each node is for debugging. \
Added two additional nodes for Ember-to-Ember and Ember-to-OSC, \
**these are still in the test phase. Any feedback on bugs is hugely appreciated**.

Prerequisites in flow:
**Target and Source addresses are accessed via flow.context arrays with matching index.**

To make managing your target and source arrays easier, EmberOut accepts separate arrays for different DSP targets. \
You could also put all targets into one array, if that is more convenient for you. \
v1.4.0 Adds a node that guides you through the creation of arrays, at the moment only for EmberOut. It reacts to msg.topic "create". In Templates folder you also find flows with a customisable function instead. 

It is also recommended to run only one ember+ Node per subflow, and create the necessary arrays for each. \
\
For EmberOut: \
oscDictFader -> emberDictFader  \
oscDictGain ->  emberDictGain   \
oscDictPFL -> emberDictPFL   \
oscDictGrp ->  emberDictGrp  \
oscDictGrpPFL -> emberDictGrpPFL  \
\
For EmberIn: \
emberInputDict   -> oscOutputDict \
emberInputDictPFL -> oscOutputDictPFL \
emberInputDictGrp   -> oscOutputDictGrp \
emberInputDictGrpPFL -> oscOutputDictGrpPFL \
\
For EmberX: \
emberInputDict -> emberOutputDict 
emberInputDictGrp -> emberOutputDictGrp


You also need: \
ignoreListDict 

You need the ignoreList array, which should contain every right channel of stereo channels in the ember targets, if you filled out the other arrays automatically. It will prevent timeouts when trying to set values for these channels. \

Aside from the osc-input, you also need to be able to inject a number of command code words. \
msg.topic "reconnect" 
msg.topic "get Nodes" 
msg.topic "reScan" 
msg.topic "disconnect" 
\
Workflow: 

1. Put target IP into node config. 
2. inject msg.topic "reconnect". 
3. inject msg.topic "get Nodes". 
4. wait for "get Node" operation to be finished. 
