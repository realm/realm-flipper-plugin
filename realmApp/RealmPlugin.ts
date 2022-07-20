import {Flipper} from 'react-native-flipper';
import Realm, {Configuration} from 'realm';

export class RealmPlugin {
  config: Configuration;
  realms: Realm[];
  connection: Flipper.FlipperConnection;
  realmsMap: Map<string, Realm>;
  constructor(
    config: Configuration,
    realms: Realm[],
    connection: Flipper.FlipperConnection,
  ) {
    this.config = config;
    this.realms = realms;
    this.connection = connection;
    this.realmsMap = new Map<string, Realm>();
    realms.forEach(realm => {
      this.realmsMap.set(realm.path, realm);
    });
  }

  connectPlugin() {
    this.connection.receive('getRealms', () => {
      this.connection.send('getRealms', {
        realms: Array.from(this.realmsMap.keys()),
      });
    });
    this.connection.receive('getObjects', obj => {
      const realm = this.realmsMap.get(obj.realm);
      const schema = obj.schema;
      if (!realm) {
        return;
      }
      const objects = realm.objects(schema);
      this.connection.send('getObjects', {objects: objects});
    });
    this.connection.receive('getSchemas', obj => {
      const realm = this.realmsMap.get(obj.realm);
      if (!realm) {
        return;
      }
      const schema = realm.schema;
      this.connection.send('getSchemas', {schemas: schema});
    });
    this.connection.receive('executeQuery', obj => {
      const realm = this.realmsMap.get(obj.realm);
      if (!realm) {
        return;
      }
      const objs = realm.objects(obj.schema);
      if (obj.query === '') {
        this.connection.send('executeQuery', {result: objs});
        return;
      }

      let res;
      try {
        res = {result: objs.filtered(obj.query)};
      } catch (err) {
        res = {result: err.message};
      }

      this.connection.send('executeQuery', res);
    });
    this.connection.receive('addObject', obj => {
      const realm = this.realmsMap.get(obj.realm);
      if (!realm) {
        return;
      }
      realm.write(() => {
        let t = realm.create(obj.schema, obj.object)
        console.log('created', t)
      });

      const objects = realm.objects(obj.schema);
      this.connection.send('getObjects', {objects: objects});
    });
  }
}
