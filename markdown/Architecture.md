
# Architecture

On a high level the Realm Flipper Plugin consists of the Desktop plugin and the mobile plugin on the device which communicate using Remote Procedure Calls (RPC). In the following we take a closer look at these components and explain how they work on the inside.

# Desktop Plugin

## Plugin API and State (index.tsx)

The index file is the heartpiece of the desktop plugin. It contains the plugin function which defines the plugin API for the Realm Flipper Plugin. It carries the pluginState and a multitude of functions for communication with the mobile plugin. These are either called from other components of the desktop plugin or executed when an RPC from the mobile plugin is received. The pluginState contains data - e.g. regarding Realms, objects and schemas - that is used in various places of the desktop plugin.
The plugin API is exposed using Flippers usePlugin() hook. This hook is used in multiple other components.

Besides the plugin the index file contains the functional component with the name Component() which is the entry point of the React application. 

# Mobile Plugin