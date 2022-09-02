
# Architecture

On a high level the Realm Flipper Plugin consists of the desktop plugin and the mobile plugin on the device which communicate using Remote Procedure Calls (RPC). In the following we take a closer look at these components and explain how they work on the inside.

# Desktop Plugin

## Plugin API and State (index.tsx)

The index file is the central component of the desktop plugin. It contains the plugin function which defines the plugin API for the Realm Flipper Plugin. It carries the pluginState and a multitude of functions for communication with the mobile plugin, e.g. getSchemas() or executeQuery(). These are either called from other components of the desktop plugin or executed when an RPC from the mobile plugin is received. These functions trigger RPC calls with client.send() and define how the response from the mobile device is handled. Usually the pluginState is updated with the received information (Read more about this in the [communication documentation](Communication.md))
The pluginState contains data, e.g. regarding Realms, objects and schemas. The plugin API and pluginState are exposed using Flippers usePlugin() hook. This hook is used in multiple other components.

## React entry point (index.tsx)

Besides the plugin the index file contains the functional component with the name Component() which is the entry point of the React front-end application. It returns JSX components for the three different tabs of the plugin as well the header.

## DataVisualizer

The DataVisualizer is the core component of the data tab. It is 






# Mobile Plugin

