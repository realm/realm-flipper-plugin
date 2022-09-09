# How Live Object Updating works

## Adding listeners
Live updating works by attatching listeners to the objects that have currently been fetched. For example, when the phone receives a 'getObjects' notifications:

```ts

connection.receive("getObjects", (req: getObjectsQuery, responder) => {
    const realm = realmsMap.get(req.realm);
    if (!realm) {
        responder.error({ message: "No realm found" });
        return;
    }
    const { schema, sortingColumn, sortingDirection, query, cursor } = req;
    let objects = realm.objects(schema);
    listenerHandler = new Listener(
        schemaToObjects,
        schema,
        objects,
        sortingColumn,
        sortingDirection,
        connection,
        realm.schema
    );
    listenerHandler.handleAddListener();
```

We initialize a ListenerHandler object with different properties related to the current getObjectsQuery, and then call `handleAddListener`:

```ts
handleAddListener() {
    if (this.schemaToObjects.has(this.schema)) {
        this.schemaToObjects.get(this.schema).removeAllListeners();
    }
    let objectsToListenTo: Realm.Results<Realm.Object> = this.objects;
    const shouldSortDescending = this.sortingDirection === "descend";
    if (this.sortingColumn) {
        objectsToListenTo = this.objects.sorted(
        this.sortingColumn,
        shouldSortDescending
        );
    }
    objectsToListenTo.addListener(this.onObjectsChange);
    this.schemaToObjects.set(this.schema, objectsToListenTo);
    return this.schemaToObjects;
}
```

We track the current `objectsCurrentlyListeningTo: Realm.Result` and remove all listeners from it, everytime we want to add a new one. This preserves the invariant of only keeping one listener at a time, avoiding duplicate events. The second invariant is that the objects currently being listened to,  When we add a listener, we add it to the collection that matches the current query state of the desktop plugin, by keeping in mind the sortingDirection and sortingColumn. Lastly we actually add the listener `onObjectsChange` and assign the objects to `objectsCurrentlyListeningTo`

```ts
onObjectsChange = (objects, changes) => {
    changes.deletions.forEach((index) => {
        if (this.connection) {
        this.connection.send("liveObjectDeleted", {
            index: index,
            schema: this.schema,
        });
        this.connection.send("getCurrentQuery");
        }
    });

    changes.insertions.forEach((index) => {
        const inserted = objects[index];
        const schema = this.schemas.find(
            (schemaObj) => this.schema === schemaObj.name
        );
        const converted = convertObjectsToDesktop([inserted], schema)[0];
        if (this.connection) {
        this.connection.send("liveObjectAdded", {
            newObject: converted,
            index: index,
            schema: this.schema,
            newObjectKey: inserted._objectKey(),
        });
        this.connection.send("getCurrentQuery");
        }
});

    changes.modifications.forEach((index) => {
        const modified = objects[index];
        const schema = this.schemas.find(
            (schemaObj) => this.schema === schemaObj.name
        );
        const converted = convertObjectsToDesktop([modified], schema)[0];
        if (this.connection) {
        this.connection.send("liveObjectEdited", {
            newObject: converted,
            index: index,
            schema: this.schema,
            newObjectKey: modified._objectKey(),
        });
        this.connection.send("getCurrentQuery");
        }
    });
};
```
We have three different cases, `deletions`, `insertions` and `modifications`. For all of them we send over the schema as a sanity check to make sure we are only modifying the currentSchema the user is viewing on the plugin.  
For `deletions` we send over the `index` of the object which was just deleted, and since the objects we are listening to are always matching the current query state on the plugin, we know it's the right index to remove. 
For `insertions` we send over the `newObject`, the `index` and the `newObjectKey`, the latter being the `_objectKey`of the newly added object.
For `modifications` we send over the same as `insertions`. 

The desktop plugin listens to all three events

```tsx

   client.onMessage('liveObjectDeleted', (data: DeleteLiveObjectRequest) => {
    const state = pluginState.get();
    const { index, schema } = data;
    if (schema != state.currentSchema?.name) {
      return;
    }
    if (index > state.objects.length) {
      pluginState.set({
        ...state,
        totalObjects: state.totalObjects - 1,
      });
      return;
    }
    const newObjects = state.objects;
    newObjects.splice(index, 1);
    const newLastObject = newObjects[newObjects.length - 1];
    pluginState.set({
      ...state,
      objects: [...newObjects],
      totalObjects: state.totalObjects - 1,
      cursor: newLastObject ? newLastObject._objectKey as string: null,
    });
  });
```
We check if the object being deleted is currently in view, then we remove it from the objects in memory and update the pluginState accordingly.

```tsx
 client.onMessage('liveObjectAdded', (data: AddLiveObjectRequest) => {
    const state = pluginState.get();
    const { newObject, index, schema, newObjectKey } = data;
    if (schema != state.currentSchema?.name) {
      return;
    }
    if (index > state.objects.length) {
       pluginState.set({
         ...state,
         totalObjects: state.totalObjects + 1,
       });
      return;
    }
    const clone = structuredClone(newObject);
    clone._objectKey = newObjectKey;
    const newObjects = state.objects;
    const addedObject = convertObjects(
      [clone],
      state.currentSchema,
      downloadData
    )[0]; 
    newObjects.splice(index, 0, addedObject);
    const newLastObject = newObjects[newObjects.length - 1];
    pluginState.set({
      ...state,
      objects: [...newObjects],
      totalObjects: state.totalObjects + 1,
      cursor: newLastObject._objectKey as string,
    });
  });


  client.onMessage('liveObjectEdited', (data: EditLiveObjectRequest) => {
    const state = pluginState.get();
    const { index, schema, newObject, newObjectKey } = data;
    if (schema != state.currentSchema?.name) {
      return;
    }
    if (index > state.objects.length) {
      return;
    }
    const clone = structuredClone(newObject);
    clone._objectKey = newObjectKey;
    const newObjects = state.objects;
    const addedObject = convertObjects(
      [clone],
      state.currentSchema,
      downloadData
    )[0];
    newObjects.splice(index, 1, addedObject);
    const newLastObject = newObjects[newObjects.length - 1];
    pluginState.set({
      ...state,
      objects: [...newObjects],
      cursor: newLastObject._objectKey as string,
    });
  });
```

Adding and editing are somewhat similiar. We first add the _objectKey property to the new object we receive from the phone. Next we convert the object which handles formatting binary data as a downloadable format. Finally, we add the new object to the objects in memory and update the pluginState. 

You may have noticed the function call `this.connection.send("getCurrentQuery");`. This sends a "state-check" to the desktop plugin:
```tsx
client.onMessage('getCurrentQuery', () => {
    const state = pluginState.get();
    client.send('receivedCurrentQuery', {
      schema: state.currentSchema ? state.currentSchema.name : null,
      realm: state.selectedRealm,
      sortingColumn: state.sortingColumn,
      sortingDirection: state.sortingDirection,
    });
  });
```
which sends back the current query state. The app listens for `receivedCurrentQuery`:

```ts
connection.receive("receivedCurrentQuery", (obj) => {
    const realm = realmsMap.get(obj.realm);
    if (!realm || !obj.schema) {
       return;
    }
    listenerHandler = new Listener(
        schemaToObjects,
        obj.schema,
        realm.objects(obj.schema),
        obj.sortingColumn,
        obj.sortingDirection,
        connection,
        realm.schema
    );
    listenerHandler.handleAddListener();
});
```

The app adds a listener according to the current query state. The app also receives the current query state on each connect, as since listeners are removed when reloading the app (through metro or saving), we need to add a new listener when the app is done re-loading. 

## Removing listeners
Everytime the user reloads metro or saves their code for the app, the apps state is reloaded, which clears `objectsCurrentlyListeningTo: Realm.Result`, making us lose the reference to the objects holding the listener. This is a problem, since the listener persists on the database, which is now unable to be removed. This eventually creates duplicate listeners, thus duplicate events and duplicate objects being sent to the plugin. This is why we need to use the React hook `useEffect`, which provides a clean-up function where we pass in a callback which removes all listeners:

```tsx
return () => {
    if (listenerHandler) {
        listenerHandler.removeAllListeners();
    }
};
```

Similarly, we remove all listeners on disconnect from the Flipper desktop plugin

```tsx      
onDisconnect() {
    if (listenerHandler) {
        listenerHandler.removeAllListeners();
    }
},
```

# Issues 
It's very difficult to keep track of what is currently being listened to. Crashes from Flipper itself will clear `objectsCurrentlyListeningTo: Realm.Result`, making us lose the reference to the objects holding the listener, as the cleanup function doesn't run. 

In addition, there are multiple issues on GitHub describing bugs related to live object listening: [#102](https://github.com/realm/realm-flipper-plugin/issues/102), [#104](https://github.com/realm/realm-flipper-plugin/issues/104), ["#101"](https://github.com/realm/realm-flipper-plugin/issues/101).

# Possible solutions
The central problem is removing the listeners, which means keeping track of which listeners are currently active. This is currently being done on the device itself, which is a liability because developing applications involves reloading and saving your app, thus clearning the data structure used for keeping track of active listeners. Keeping some sort of cache, *independent of app reloads and saves*, consisting of the object references which currently hold a listener, would solve the problem. 