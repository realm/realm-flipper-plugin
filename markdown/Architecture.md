
# Architecture

On a high level the Realm Flipper Plugin consists of the Desktop plugin and the mobile plugin on the device which communicate using Remote Procedure Calls. In the following we take a closer look at these components and explain how they work on the inside.

# Desktop Plugin

## index.tsx

The index file is the heartpiece of the desktop plugin. It contains the constant plugin() which carries the pluginState and a multitude of functions for communicating with the mobile plugin. These are either called from other components of the desktop plugin or executed when a RPC from the mobile plugin is received.








# Mobile Plugin