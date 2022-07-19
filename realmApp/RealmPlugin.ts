import React from 'react';
import {Flipper} from 'react-native-flipper';
import Realm, {Configuration} from 'realm';
// config: Configuration,
//     realms: Realm[],
//     connection: Flipper.FlipperConnection,
export class RealmPlugin extends React.Component {
  config: Configuration;
  realms: Realm[];
  connection: Flipper.FlipperConnection;
  realmsMap: Map<string, Realm>;
  constructor(props) {
    super(props);
    console.log(this.props);
    this.config = props.config;
    this.realms = props.realms;
    this.connection = props.connection;
    this.realmsMap = new Map<string, Realm>();
    props.realms.forEach(realm => {
      this.realmsMap.set(realm.path, realm);
    });
  }

  connectPlugin() {
    console.log('connecting');
    this.connection.receive('getRealms', () => {
      this.connection.send('getRealms', {
        realms: Array.from(this.realmsMap.keys()),
      });
    });
    this.connection.receive('getObjects', obj => {
      const realm = this.realmsMap.get(obj.realm);
      realm?.addListener('change', () => {
        console.log("big listener fires")
        this.forceUpdate();
      });
      const schema = obj.schema;
      if (!realm) {
        return;
      }
      const objects = realm.objects(schema);
      try {
        console.log(this.connection);
        objects.addListener(this.onObjectsChange);
      } catch (error) {
        console.error(
          `An exception was thrown within the change listener: ${error}`,
        );
      }
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
      try {
        objs.addListener(this.onObjectsChange);
      } catch (error) {
        console.error(
          `An exception was thrown within the change listener: ${error}`,
        );
      }
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
  }

  onObjectsChange = (objects, changes) => {
    console.log('this is', this);
    changes.deletions.forEach(index => {
      console.log(`small listener fires`, this.connection);
      if (this.connection) {
        this.connection.send('liveObjectDeleted', {index: index});
      }
    });
    // Handle newly added Dog objects
    changes.insertions.forEach(index => {
      const inserted = objects[index];
      console.log(`small listener fires`, this);
      if (this.connection) {
        this.connection.send('liveObjectAdded', {newObject: inserted});
      }
    });
    // Handle Dog objects that were modified
    changes.modifications.forEach(index => {
      const modified = objects[index];
      console.log(`small listener fires`, this.connection);
      if (this.connection) {
        this.connection.send('liveObjectEdited', {
          newObject: modified,
          index: index,
        });
      }
    });
  };
}
