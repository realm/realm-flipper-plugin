import React, {useEffect} from 'react';
import {addPlugin, Flipper} from 'react-native-flipper';
import Realm, {CanonicalObjectSchema} from 'realm';
import {
  convertObjectsFromDesktop,
  convertObjectsToDesktop,
} from './ConvertFunctions';
import {Listener} from './Listener';

const {BSON} = Realm;
// config: Configuration,
//     realms: Realm[],
//     connection: Flipper.FlipperConnection,

type PluginConfig = {
  realms: Realm[];
  connection: Flipper.FlipperConnection;
};

type getObjectsQuery = {
  schema: string;
  realm: string;
  cursor: string;
  limit: number;
  sortingDirection: 'ascend' | 'descend';
  sortingColumn: string;
};

const RealmPlugin = (props: {realms: Realm[]}) => {
  let realmsMap = new Map<string, Realm>();
  let listenerHandler: Listener;
  const {realms} = props;
  useEffect(() => {
    let objectsCurrentlyListeningTo: Realm.Results<Realm.Object>;
    realms.forEach(realm => {
      realmsMap.set(realm.path, realm);
    });
    addPlugin({
      getId() {
        return 'realm';
      },
      onConnect(connection) {
        // connection.receive
        connection.send('getCurrentQuery');

        connection.receive('receivedCurrentQuery', obj => {
          console.log('received');
          const realm = realmsMap.get(obj.realm);
          if (!realm || !obj.schema) {
            return;
          }
          console.log(obj);
          listenerHandler = new Listener(
            objectsCurrentlyListeningTo,
            obj.schema,
            realm.objects(obj.schema),
            obj.sortingColumn,
            obj.sortingDirection,
            connection,
            realm.schema,
          );
          objectsCurrentlyListeningTo = listenerHandler.handleAddListener();
        });

        connection.receive('getRealms', (_, responder) => {
          responder.success({
            realms: Array.from(realmsMap.keys()),
          });
        });

        connection.receive('getObjects', (req, responder) => {
          console.log('message: ', req);
          const realm = realmsMap.get(req.realm);
          if (!realm) {
            responder.error({message: 'No realm found'});
            return;
          }
          const {schema, sortingColumn, sortingDirection, query, cursor} = req;
          let objects = realm.objects(schema);
          listenerHandler = new Listener(
            schemaToObjects,
            schema,
            objects,
            sortingColumn,
            sortingDirection,
            connection,
            realm.schema,
          );
          objectsCurrentlyListeningTo = listenerHandler.handleAddListener();
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
          const firstObject = realm._objectForObjectKey(schema, queryCursor); //First object to send
          let indexOfFirstObject = objects.findIndex(
            obj => obj._objectKey() === firstObject._objectKey(),
          );
          if (query) {
            //Filtering if RQL query is provided
            try {
              objects = objects.filtered(query);
            } catch (e) {
              console.log('error, returning:', e.message);
              responder.error({
                message: e.message,
              });
              return;
            }
          }
          objects = objects.slice(
            //Send over list from index of first object to the limit
            indexOfFirstObject === 0
              ? indexOfFirstObject
              : indexOfFirstObject + 1,
            indexOfFirstObject + (LIMIT + 1),
          );
          const afterConversion = convertObjectsToDesktop(
            objects,
            realm.schema.find(schemaa => schemaa.name === schema),
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
          // console.log('addObject', obj);
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

          const converted = convertObjectsFromDesktop(
            [obj.object],
            realm,
            obj.schema,
          )[0];

          const realmObj = realm._objectForObjectKey(
            schema.name,
            obj.objectKey,
          );
          if (!realmObj) {
            responder.error({message: 'Realm Object removed while editing.'});
            return;
          }

          realm.write(() => {
            propsChanged.forEach(propName => {
              realmObj[propName] = converted[propName];
            });
          });
        });

        connection.receive('removeObject', obj => {
          const realm = realmsMap.get(obj.realm);
          if (!realm) {
            return;
          }
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
        if (listenerHandler) {
          listenerHandler.removeAllListeners();
          console.log('Disconnected');
        }
      },
    });
    return () => {
      if (listenerHandler) {
        listenerHandler.removeAllListeners();
        console.log('Disconnected');
      }
    };
  });
  return <></>;
};

export default React.memo(RealmPlugin);
