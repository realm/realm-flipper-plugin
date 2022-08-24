# Communication
The desktop plugin communicates with the React Native application through an RPC communication established by WebSockets. The plugin uses the [Client Plugin API](https://fbflipper.com/docs/extending/create-plugin/) defined by Flipper. The architecture of using Flipper with React Native is further documented under [Architecture](https://fbflipper.com/docs/extending/arch/) in the Flipper Docs.

A typical round-trip consists of the plugin making a request to the app by calling `client.send('eventName')`, thus emitting an event from the desktop the app. The event is received by the app by `connection.receive('eventName', () => {})`, where the callback usually calls a function on the Realm and sends back the result using `responder.success({result})` or `connection.send({result})`. The roundtrip can be visualized:

![A diagram of the Realm Flipper Plugin communication archictecture](/realmFlipperPlugin/communicationDiagram.png "Realm Flipper Plugin communication archictecture")
## API (TODO: needs better name)
___
The plugin and app listens for events emitted bi-directionally, to faciliate data sharing over the wire. Specifically, the Realm Flipper Plugin communicates with the React Native application through the following methods:

### App events
___
The app listens for the following events:

### `getRealms`

Gets the user-specified realms and sends them to the plugin.

### `getSchemas`

### `getObjects`

### `getOneObject` -- TODO: will probably be deleted
* * ddaaaaa

### `receivedCurrentQuery`

### `executeQuery`

### `addObject`

### `modifyObject`

### `removeObject`

### Plugin events
The plugin listens for:

* getOneObject -- TODO: probably will be removed!!

* `getCurrentQuery`

* `liveObjectAdded`

* `liveObjectDeleted`

* `liveObjectEdited`

