import {Flipper} from 'react-native-flipper';
import {RealmFlipperPlugin} from './RealmPlugin';

export const registerObjectManipulation = (
  plugin: RealmFlipperPlugin,
  connection: Flipper.FlipperConnection,
) => {
  connection.receive('addObject', (obj, responder) => {
    const realm = plugin.realmsMap.get(obj.realm);
    if (!realm) {
      return;
    }
    const converted = obj.object; // TODO: convert
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

  connection.receive('modifyObject', obj => {
    const realm = plugin.realmsMap.get(obj.realm);
    if (!realm) {
      return;
    }

    // const converted = typeConverter(obj.object, realm, obj.schema);
    realm.write(() => {
      realm.create(obj.schema, obj.object, 'modified');
    });

    // const objects = realm.objects(obj.schema);
    // connection.send('getObjects', {objects: objects});
  });

  connection.receive('removeObject', (obj, responder) => {
    const realm = plugin.realmsMap.get(obj.realm);
    if (!realm) {
      return;
    }

    const schema = realm.schema.find(schema => schema.name === obj.schema);

    // const object = typeConverter(obj.object, realm, schema?.name);
    const object = obj.object;

    const primaryKey = schema?.primaryKey;
    if (!schema || !primaryKey) {
      return;
    }

    try {
      realm.write(() => {
        const realmObj = realm.objectForPrimaryKey(
          schema.name,
          object[primaryKey],
        );
        realm.delete(realmObj);
      });
    } catch (err) {
      responder.error({error: err.message});
    }

    // const objects = realm.objects(obj.schema);
    // connection.send('getObjects', {objects: objects});
  });
};
