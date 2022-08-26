export class Listener {
  schemaToObjects: Map<string, Realm.Results<Realm.Object>>;
  schema;
  objects;
  sortingColumn;
  sortingDirection;
  connection;
  constructor(
    schemaToObjects,
    schema,
    objects,
    sortingColumn,
    sortingDirection,
    connection,
  ) {
    this.schemaToObjects = schemaToObjects;
    this.schema = schema;
    this.objects = objects;
    this.sortingColumn = sortingColumn;
    this.sortingDirection = sortingDirection;
    this.connection = connection;
  }

  removeAllListeners() {
    for (let objects of this.schemaToObjects.values()) {
      objects.removeAllListeners();
    }
  }

  handleAddListener() {
    if (this.schemaToObjects.has(this.schema)) {
      this.schemaToObjects.get(this.schema).removeAllListeners();
    }
    let objectsToListenTo: Realm.Results<Realm.Object> = this.objects;
    const shouldSortDescending = this.sortingDirection === 'descend';
    if (this.sortingColumn) {
      objectsToListenTo = this.objects.sorted(
        this.sortingColumn,
        shouldSortDescending,
      );
    }
    objectsToListenTo.addListener(this.onObjectsChange);
    this.schemaToObjects.set(this.schema, objectsToListenTo);
    return this.schemaToObjects;
  }

  onObjectsChange = (objects, changes) => {
    changes.deletions.forEach(index => {
      if (this.connection) {
        this.connection.send('liveObjectDeleted', {
          index: index,
          schema: this.schema,
        });
        this.connection.send('getCurrentQuery');
      }
    });

    changes.insertions.forEach(index => {
      const inserted = objects[index];
      if (this.connection) {
        this.connection.send('liveObjectAdded', {
          newObject: inserted,
          index: index,
          schema: this.schema,
        });
        this.connection.send('getCurrentQuery');
      }
    });

    changes.modifications.forEach(index => {
      const modified = objects[index];
      if (this.connection) {
        this.connection.send('liveObjectEdited', {
          newObject: modified,
          index: index,
          schema: this.schema,
        });
        this.connection.send('getCurrentQuery');
      }
    });
  };
}
