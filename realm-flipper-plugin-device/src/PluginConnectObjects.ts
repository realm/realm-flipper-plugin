import {Flipper} from 'react-native-flipper';
import {convertObjectsToDesktop} from './ConvertFunctions';

// Attaches a listener to the collections which sends update
// notifications to the Flipper plugin.
export class PluginConnectedObjects {
  // Connected objects that the listener is attached to.
  connectedObjects: Realm.Results<Object>;
  schemaName: string;
  objects: Realm.Results<Object>;
  sortingColumn: string;
  sortingDirection: 'ascend' | 'descend';
  connection: Flipper.FlipperConnection;
  schemas;
  constructor(
    objects: Realm.Results<Object>,
    schemaName: string,
    sortingColumn: string,
    sortingDirection: 'ascend' | 'descend',
    connection: Flipper.FlipperConnection,
    schemas: Realm.ObjectSchema[],
  ) {
    this.schemaName = schemaName;
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
          schemaName: this.schemaName,
        });
        this.connection.send('getCurrentQuery', undefined);
      }
    });

    changes.insertions.forEach((index: number) => {
      const inserted = objects[index];
      const schema = this.schemas.find(
        (schemaObj: Realm.ObjectSchema) => this.schemaName === schemaObj.name,
      );
      const converted = convertObjectsToDesktop([inserted], schema)[0];
      if (this.connection) {
        this.connection.send('liveObjectAdded', {
          newObject: converted,
          index: index,
          schemaName: this.schemaName,
          objects: objects,
        });
        this.connection.send('getCurrentQuery', undefined);
      }
    });

    changes.newModifications.forEach((index: number) => {
      const modified = objects[index];
      const schema = this.schemas.find(
        schemaObj => this.schemaName === schemaObj.name,
      );
      const converted = convertObjectsToDesktop([modified], schema)[0];
      if (this.connection) {
        this.connection.send('liveObjectEdited', {
          newObject: converted,
          index: index,
          schemaName: this.schemaName,
        });
        this.connection.send('getCurrentQuery', undefined);
      }
    });
  };
}
