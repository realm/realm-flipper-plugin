import React, {useEffect, useRef} from 'react';
import {addPlugin} from 'react-native-flipper';
import Realm, {CanonicalObjectSchema} from 'realm';
import {
  convertObjectsFromDesktop,
  convertObjectsToDesktop,
} from './ConvertFunctions';
import {PluginConnectedObjects} from './PluginConnectObjects';

type getObjectsQuery = {
  schema: string;
  realm: string;
  cursor: string;
  limit: number;
  sortingDirection: 'ascend' | 'descend';
  sortingColumn: string;
  query: string;
};

const RealmPlugin = React.memo((props: {realms: Realm[]}) => {
  const realms = useRef<Realm[]>(props.realms);

  useEffect(() => {
    let connectedObjects: PluginConnectedObjects = null;
    let realmsMap = new Map<string, Realm>();

    realms.current.forEach(realm => {
      realmsMap.set(realm.path, realm);
    });
    addPlugin({
      getId() {
        return 'realm';
      },
      onConnect(connection) {
        connection.send('getCurrentQuery', undefined);

        connection.receive('receivedCurrentQuery', obj => {
          const realm = realmsMap.get(obj.realm);
          if (!realm || !obj.schema) {
            return;
          }
          if (connectedObjects != null) {
            connectedObjects.removeListener();
          }
          connectedObjects = new PluginConnectedObjects(
            realm.objects(obj.schema),
            obj.schema,
            obj.sortingColumn,
            obj.sortingDirection,
            connection,
            realm.schema,
          );
        });

        connection.receive('getRealms', (_, responder) => {
          responder.success({
            realms: Array.from(realmsMap.keys()),
          });
        });

        connection.receive('getObjects', (req: getObjectsQuery, responder) => {
          const realm = realmsMap.get(req.realm);
          if (!realm) {
            responder.error({message: 'No realm found'});
            return;
          }
          const {schema, sortingColumn, sortingDirection, query, cursor} = req;
          let objects = realm.objects(schema);
          if (connectedObjects != null) {
            connectedObjects.removeListener();
          }
          connectedObjects = new PluginConnectedObjects(
            objects,
            schema,
            sortingColumn,
            sortingDirection,
            connection,
            realm.schema,
          );
          const totalObjects = objects.length;
          if (!totalObjects || objects.isEmpty()) {
            responder.success({
              objects: [],
              total: totalObjects,
              hasMore: false,
              nextCursor: null,
            });
            return;
          }
          let queryCursor = null;
          const LIMIT = 50;
          const shouldSortDescending = sortingDirection === 'descend';
          queryCursor = cursor ?? objects[0]._objectKey(); //If no cursor, choose first object in the collection
          if (sortingColumn) {
            objects = objects.sorted(sortingColumn, shouldSortDescending);
            queryCursor = cursor ?? objects[0]._objectKey();
          }

          //@ts-expect-error This is not a method which is exposed publically
          const firstObject = realm._objectForObjectKey(schema, queryCursor); //First object to send
          let indexOfFirstObject = objects.findIndex(
            obj => obj._objectKey() === firstObject._objectKey(),
          );
          if (query) {
            //Filtering if RQL query is provided
            try {
              objects = objects.filtered(query);
            } catch (e) {
              responder.error({
                message: e.message,
              });
              return;
            }
          }
          let slicedObjects = objects.slice(
            //Send over list from index of first object to the limit
            indexOfFirstObject === 0
              ? indexOfFirstObject
              : indexOfFirstObject + 1,
            indexOfFirstObject + (LIMIT + 1),
          );
          const afterConversion = convertObjectsToDesktop(
            slicedObjects,
            realm.schema.find(
              convertedSchema => convertedSchema.name === schema,
            ),
          );
          responder.success({
            objects: afterConversion,
            total: totalObjects,
            hasMore: objects.length >= LIMIT,
            nextCursor: objects[objects.length - 1]?._objectKey(),
          });
        });

        connection.receive('getSchemas', (obj, responder) => {
          const realm = realmsMap.get(obj.realm);
          if (!realm) {
            responder.error({message: 'No realm found,'});
            return;
          }
          const schemas = realm.schema;
          responder.success({schemas: schemas});
        });

        connection.receive('downloadData', (obj, responder) => {
          const realm = realmsMap.get(obj.realm);
          if (!realm) {
            responder.error({message: 'Realm not found'});
            return;
          }
          //@ts-expect-error This is not a method which is exposed publically
          const object = realm._objectForObjectKey(obj.schema, obj.objectKey);
          responder.success({
            data: Array.from(new Uint8Array(object[obj.propertyName])),
          });
        });

        connection.receive('addObject', (obj, responder) => {
          const realm = realmsMap.get(obj.realm);
          if (!realm) {
            return;
          }
          const converted = convertObjectsFromDesktop(
            [obj.object],
            realm,
            obj.schema,
          )[0];
          try {
            realm.write(() => {
              realm.create(obj.schema, converted);
            });
          } catch (err) {
            responder.error({
              error: err.message,
            });
            return;
          }
          responder.success(undefined);
        });
        connection.receive('modifyObject', (obj, responder) => {
          const realm = realmsMap.get(obj.realm);
          if (!realm) {
            return;
          }
          const propsChanged = obj.propsChanged;
          const schema = realm.schema.find(
            schemaObj => schemaObj.name === obj.schema,
          ) as CanonicalObjectSchema;

          const converted: Record<string, unknown> = convertObjectsFromDesktop(
            [obj.object],
            realm,
            obj.schema,
          )[0];

          //@ts-expect-error This is not a method which is exposed publically
          const realmObj = realm._objectForObjectKey(
            schema.name,
            obj.objectKey,
          );
          if (!realmObj) {
            responder.error({message: 'Realm Object removed while editing.'});
            return;
          }

          realm.write(() => {
            propsChanged.forEach((propName: string) => {
              realmObj[propName] = converted[propName];
            });
          });
        });

        connection.receive('removeObject', obj => {
          const realm = realmsMap.get(obj.realm);
          if (!realm) {
            return;
          }

          //@ts-expect-error This is not a method which is exposed publically
          const foundObject = realm._objectForObjectKey(
            obj.schema,
            obj.objectKey,
          );
          realm.write(() => {
            realm.delete(foundObject);
          });
        });
      },
      onDisconnect() {
        if (connectedObjects) {
          connectedObjects.removeListener();
        }
      },
    });
    return () => {
      if (connectedObjects) {
        connectedObjects.removeListener();
      }
    };
  }, []);
  return <></>;
});

export default RealmPlugin;
export {RealmPlugin};
