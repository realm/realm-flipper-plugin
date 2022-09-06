import { Flipper } from "react-native-flipper";
import { Results } from "realm";
import { convertObjectsToDesktop } from "./ConvertFunctions";

export class Listener {
  objectsCurrentlyListeningTo: Results<Object>;
  schema: string;
  objects: Results<Object>;
  sortingColumn: string;
  sortingDirection: "ascend" | "descend";
  connection: Flipper.FlipperConnection;
  schemas;
  constructor(
    objectsCurrentlyListeningTo: Results<Object>,
    schema: string,
    objects: Results<Object>,
    sortingColumn: string,
    sortingDirection: "ascend" | "descend",
    connection: Flipper.FlipperConnection,
    schemas
  ) {
    this.objectsCurrentlyListeningTo = objectsCurrentlyListeningTo;
    console.log("initialized", objectsCurrentlyListeningTo);
    this.schema = schema;
    this.objects = objects;
    this.sortingColumn = sortingColumn;
    this.sortingDirection = sortingDirection;
    this.connection = connection;
    this.schemas = schemas;
  }

  removeAllListeners() {
    console.log("removing all from", this.objectsCurrentlyListeningTo);
    if (this.objectsCurrentlyListeningTo.length) {
      console.log("removing all");
      this.objectsCurrentlyListeningTo.removeAllListeners();
    }
  }

  handleAddListener() {
    console.log("removing before adding", this.objectsCurrentlyListeningTo);
    if (this.objectsCurrentlyListeningTo.length) {
      console.log("removing");
      this.objectsCurrentlyListeningTo.removeAllListeners();
    }
    let objectsToListenTo: Realm.Results<Object> = this.objects;
    const shouldSortDescending = this.sortingDirection === "descend";
    if (this.sortingColumn) {
      objectsToListenTo = this.objects.sorted(
        this.sortingColumn,
        shouldSortDescending
      );
    }
    objectsToListenTo.addListener(this.onObjectsChange);
    this.objectsCurrentlyListeningTo = objectsToListenTo;
    console.log(
      "objectsCurrentlyListerningTo",
      this.objectsCurrentlyListeningTo
    );
    return this.objectsCurrentlyListeningTo;
  }

  onObjectsChange = (objects, changes) => {
    changes.deletions.forEach((index: number) => {
      if (this.connection) {
        this.connection.send("liveObjectDeleted", {
          index: index,
          schema: this.schema,
        });
        this.connection.send("getCurrentQuery");
      }
    });

    changes.insertions.forEach((index: number) => {
      const inserted = objects[index];
      const schema = this.schemas.find(
        (schemaObj: Record<string, unknown>) => this.schema === schemaObj.name
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

    changes.modifications.forEach((index: number) => {
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
}