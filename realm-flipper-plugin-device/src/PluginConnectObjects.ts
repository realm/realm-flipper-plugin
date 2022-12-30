import {Flipper} from 'react-native-flipper';
import {convertObjectsToDesktop} from './ConvertFunctions';

// Attaches a listener to the collections which sends update
// notifications to the Flipper plugin.
export class PluginConnectedObjects {
  // Connected objects that the listener is attached to.
  connectedObjects: Realm.Results<Object>;
  schema: string;
  objects: Realm.Results<Object>;
  sortingColumn: string;
  sortingDirection: 'ascend' | 'descend';
  connection: Flipper.FlipperConnection;
  schemas;
  constructor(
    objects: Realm.Results<Object>,
    schema: string,
    sortingColumn: string,
    sortingDirection: 'ascend' | 'descend',
    connection: Flipper.FlipperConnection,
    schemas: Realm.ObjectSchema[],
  ) {
    this.schema = schema;
    this.objects = objects;
    const shouldSortDescending = sortingDirection === 'descend';
    if (sortingColumn) {
      this.connectedObjects = this.objects.sorted(
        sortingColumn,
        shouldSortDescending,
      );
    } else {
      this.connectedObjects = this.objects;
    }
    this.sortingColumn = sortingColumn;
    this.sortingDirection = sortingDirection;
    this.connection = connection;
    this.schemas = schemas;

    this.connectedObjects.addListener(this.onObjectsChange);
  }

  removeListener() {
    this.connectedObjects.removeListener(this.onObjectsChange);
  }

  onObjectsChange: Realm.CollectionChangeCallback<Realm.Object> = (
    objects,
    changes,
  ) => {
    changes.deletions.forEach((index: number) => {
      if (this.connection) {
        this.connection.send('liveObjectDeleted', {
          index: index,
          schema: this.schema,
        });
        this.connection.send('getCurrentQuery', undefined);
      }
    });

    changes.insertions.forEach((index: number) => {
      const inserted = objects[index];
      const schema = this.schemas.find(
        (schemaObj: Realm.ObjectSchema) => this.schema === schemaObj.name,
      );
      const converted = convertObjectsToDesktop([inserted], schema)[0];
      if (this.connection) {
        this.connection.send('liveObjectAdded', {
          newObject: converted,
          index: index,
          schema: this.schema,
          objects: objects,
        });
        this.connection.send('getCurrentQuery', undefined);
      }
    });

    // TODO: should oldModifications be considered too?
    changes.newModifications.forEach((index: number) => {
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
        });
        this.connection.send('getCurrentQuery', undefined);
      }
    });
  };
}
