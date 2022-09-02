import {convertObjectsToDesktop} from './ConvertFunctions';

export class Listener {
  schemaToObjects: Map<string, Realm.Results<Realm.Object>>;
  schema;
  objects;
  sortingColumn;
  sortingDirection;
  connection;
  schemas;
  constructor(
    schemaToObjects,
    schema,
    objects,
    sortingColumn,
    sortingDirection,
    connection,
    schemas,
  ) {
    this.schemaToObjects = schemaToObjects;
    this.schema = schema;
    this.objects = objects;
    this.sortingColumn = sortingColumn;
    this.sortingDirection = sortingDirection;
    this.connection = connection;
    this.schemas = schemas;
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
      const schema = this.schemas.find(
        schemaObj => this.schema === schemaObj.name,
      );
      const converted = convertObjectsToDesktop([inserted], schema)[0];
      if (this.connection) {
        this.connection.send('liveObjectAdded', {
          newObject: converted,
          index: index,
          schema: this.schema,
          newObjectKey: inserted._objectKey(),
        });
        this.connection.send('getCurrentQuery');
      }
    });

    changes.modifications.forEach(index => {
      const modified = objects[index];
      const schema = this.schemas.find(
        schemaObj => this.schema === schemaObj.name,
      );
      const converted = convertObjectsToDesktop([modified], schema)[0];
      if (this.connection) {
        this.connection.send('liveObjectEdited', {
          newObject: converted,
          index: index,
          schema: this.schema,
          newObjectKey: modified._objectKey(),
        });
        this.connection.send('getCurrentQuery');
      }
    });
  };
}
