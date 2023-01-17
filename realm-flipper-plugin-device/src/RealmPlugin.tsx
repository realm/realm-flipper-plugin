import React, {useEffect, useRef} from 'react';
import {addPlugin} from 'react-native-flipper';
import type Realm from 'realm';
import { AddObjectRequest, DownloadDataRequest, DownloadDataResponse, GetObjectRequest, GetObjectsResponse, GetRealmsResponse, GetSchemasRequest, GetSchemasResponse, ModifyObjectRequest, ReceivedCurrentQueryRequest, RemoveObjectRequest, SerializedRealmObject } from '../SharedTypes';
import {
  convertObjectsFromDesktop,
  serializeRealmObject,
  serializeRealmObjects,
} from './ConvertFunctions';
import {PluginConnectedObjects} from './PluginConnectObjects';

type GetObjectsRequest = {
  schemaName: string;
  realm: string;
  cursor: string | null;
  sortingColumn: string | null;
  sortingDirection: 'ascend' | 'descend' | null;
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

        connection.receive('receivedCurrentQuery', (req:ReceivedCurrentQueryRequest) => {
          const realm = realmsMap.get(req.realm);
          if (!realm || !req.schemaName) {
            return;
          }
          if (connectedObjects != null) {
            connectedObjects.removeListener();
          }
          connectedObjects = new PluginConnectedObjects(
            realm.objects(req.schemaName),
            req.schemaName,
            req.sortingColumn,
            req.sortingDirection,
            connection,
            realm.schema,
          );
        });

        connection.receive('getRealms', (_, responder) => {
          responder.success({
            realms: Array.from(realmsMap.keys()),
          } as GetRealmsResponse);
        });

        connection.receive('getObject', (req: GetObjectRequest, responder) => {
          const realm = realmsMap.get(req.realm);
          if (!realm) {
            responder.error({message: 'No realm found'});
            return;
          }
          const {schemaName, objectKey} = req;
          let objects = realm.objects(schemaName);
          const totalObjects = objects.length;
          if (!totalObjects || objects.isEmpty()) {
            responder.error({message: `No objects found in selected schema "${schemaName}".`});
            return;
          }
         let requestedObject = objects.find(
            req => req._objectKey() === objectKey,
          );
          if(requestedObject == undefined) {
            responder.error({message: `Object with object key: "${objectKey}" not found.`});
            return;
          }
          const serializedObject = serializeRealmObject(
            requestedObject,
            requestedObject.objectSchema(),
          );
          responder.success(serializedObject as SerializedRealmObject);
        });

        connection.receive('getObjects', (req: GetObjectsRequest, responder) => {
          const realm = realmsMap.get(req.realm);
          if (!realm) {
            responder.error({message: 'No realm found'});
            return;
          }
          const {schemaName, sortingColumn, sortingDirection, query, cursor} = req;
          let objects = realm.objects(schemaName);
          if (connectedObjects != null) {
            connectedObjects.removeListener();
          }
          connectedObjects = new PluginConnectedObjects(
            objects,
            schemaName,
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
            } as GetObjectsResponse);
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
          const firstObject = realm._objectForObjectKey(schemaName, queryCursor); //First object to send
          let indexOfFirstObject = objects.findIndex(
            req => req._objectKey() === firstObject._objectKey(),
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
          const afterConversion = serializeRealmObjects(
            slicedObjects,
            realm.schema.find(
              convertedSchema => convertedSchema.name === schemaName,
            ),
          );
          responder.success({
            objects: afterConversion,
            total: totalObjects,
            hasMore: objects.length >= LIMIT,
            nextCursor: objects[objects.length - 1]?._objectKey(),
          } as GetObjectsResponse);
        });

        connection.receive('getSchemas', (req:GetSchemasRequest, responder) => {
          const realm = realmsMap.get(req.realm);
          if (!realm) {
            responder.error({message: 'No realm found,'});
            return;
          }
          const schemas = realm.schema;
          responder.success({schemas: schemas} as GetSchemasResponse);
        });

        connection.receive('downloadData', (req:DownloadDataRequest, responder) => {
          const realm = realmsMap.get(req.realm);
          if (!realm) {
            responder.error({message: 'Realm not found'});
            return;
          }
          //@ts-expect-error This is not a method which is exposed publically
          const object = realm._objectForObjectKey(req.schemaName, req.objectKey);
          responder.success({
            data: Array.from(new Uint8Array(object[req.propertyName])),
          } as DownloadDataResponse);
        });

        connection.receive('addObject', (req:AddObjectRequest, responder) => {
          const realm = realmsMap.get(req.realm);
          if (!realm) {
            return;
          }
          const converted = convertObjectsFromDesktop(
            [req.object],
            realm,
            req.schemaName,
          )[0];
          try {
            realm.write(() => {
              realm.create(req.schemaName, converted);
            });
          } catch (err) {
            responder.error({
              error: err.message,
            });
            return;
          }
          responder.success(undefined);
        });
        connection.receive('modifyObject', (req:ModifyObjectRequest, responder) => {
          const realm = realmsMap.get(req.realm);
          if (!realm) {
            return;
          }
          const propsChanged = req.propsChanged;
          const schema = realm.schema.find(
            schemaObj => schemaObj.name === req.schemaName,
          ) as Realm.CanonicalObjectSchema;

          const converted: Record<string, unknown> = convertObjectsFromDesktop(
            [req.object],
            realm,
            req.schemaName,
          )[0];

          //@ts-expect-error This is not a method which is exposed publically
          const realmObj = realm._objectForObjectKey(
            schema.name,
            req.objectKey,
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

        connection.receive('removeObject', (req:RemoveObjectRequest) => {
          const realm = realmsMap.get(req.realm);
          if (!realm) {
            return;
          }

          //@ts-expect-error This is not a method which is exposed publically
          const foundObject = realm._objectForObjectKey(
            req.schemaName,
            req.objectKey,
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
