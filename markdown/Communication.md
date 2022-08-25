# Communication
The desktop plugin communicates with the React Native application through an RPC communication established by WebSockets. The plugin uses the [Client Plugin API](https://fbflipper.com/docs/extending/create-plugin/) defined by Flipper. The architecture of using Flipper with React Native is further documented under [Architecture](https://fbflipper.com/docs/extending/arch/) in the Flipper Docs.

A typical round-trip consists of the plugin making a request to the app by calling `client.send('eventName')`, thus emitting an event from the desktop the app. The event is received by the app by `connection.receive('eventName', () => {})`, where the callback usually calls a function on the Realm and sends back the result using `responder.success({result})` or `connection.send({result})`. The roundtrip can be visualized:

![A diagram of the Realm Flipper Plugin communication archictecture](/realmFlipperPlugin/communicationDiagram.png "Realm Flipper Plugin communication archictecture")
## Event API
The plugin and app listens for events emitted bi-directionally, to faciliate data sharing over the wire. Specifically, the Realm Flipper Plugin communicates with the React Native application through the following methods:

### App events
___
The app listens for the following events:

### `getRealms`

Gets the user-specified realms and sends them to the plugin.

### `getSchemas(realm: string)`

Gets the schemas for a given realm and sends them to the plugin.
### `getObjects(queryObject: QueryObject)`

Takes a query request object, and sends back a `limit` amount of objects. 
### `getOneObject(primaryKey: number)`
Given a primary key, it gets one object from the backend and sends it to the desktop plugin.
### `addObject(realm: String, schema: String, objectToAdd: RealmObject)`
Adds a user-specified object to the Realm database.
### `modifyObject(realm: String, schema: String, objectToAdd: RealmObject)` -- 
Modifies an object in the Realm database.
### `removeObject(realm: String, schema: String, objectToAdd: RealmObject)`
Removed an object in the Realm database.
### Plugin events
---
The plugin listens for the following events:

### `liveObjectAdded(obj: RealmObject)`

When an object is added to the Realm, an event is sent to the desktop plugin, allowing it to update the view.

### `liveObjectDeleted(index: number)`

When an object is deleted from the Realm, an event is sent to the desktop plugin, allowing it to update the view.

### `liveObjectEdited(index: number, obj: RealmObject)`

When an object is edited from the Realm, an event is sent to the desktop plugin, allowing it to update the view.

### Keeping an updated realm collection listener
---
The plugin uses Realm Collection listeners to keep an updated view on the desktop plugin, as a key feature of Realm Databases is Live Objects. The event listeners `liveObjectDeleted` and `liveObjectEdited`, send an index in the database to delete or edit. Consequently, it's crucial that the listener constantly reflects what the user is currently viewing. For this purpose, the app implements two events, `getCurrentQuery` and `receivedCurrentQuery` who work together to keep the application updated on what the desktop plugin views, indenpendently of what is happening on the React Native app. This means that the user can (hot) reload the React Native app without the Realm Collection listeners becoming stale in regards to what the desktop plugin is showing. A typical roundtrip consists of:

1. The React Native app `connection.send('getCurrentQuery')`s to the plugin.
2. The desktop plugin listens for `'getCurrentQuery'`, and `client.send('receivedCurrentQuery')`s back the current query state, consisting of the current schema, realm, sortingColumn and sortingDirection.
3. The app listens for `'receivedCurrentQuery'` and attaches a new listener according to the received information.
### `getCurrentQuery`
The desktop plugin listens for `getCurrentQuery` as to send back the current query state to the app.
### `receivedCurrentQuery`
The app listens for `receivedCurrentQuery` as to attach an updated Realm collection listener.

## Conclusion
These functions define the communication between the plugin and the API, and are necessary for supporting the required functionality.
