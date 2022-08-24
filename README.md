<picture>
    <source srcset="./logo-dark.svg" media="(prefers-color-scheme: dark)" alt="realm by MongoDB">
    <img src="./logo.svg" alt="realm by MongoDB">
</picture>

# Realm Flipper Plugin
This is a plugin for Flipper to debug Realm databases in react-native applications.

# Features
Live Objects: See objects in real time.
Schema Dependency Graph: View schemas and their relationships.
Make changes: Create, modify and delete objects
Query: Query the database using [RQL](https://www.mongodb.com/docs/realm/realm-query-language/)

# Getting Started
To add the Realm flipper plugin to your application, call the addPlugin with an instance of *RealmFlipperPlugin*:
```ts
import {addPlugin} from 'react-native-flipper';
import {RealmFlipperPlugin} from 'TODO';

const realmList: (Realm | Realm.Configuration)[];

...

addPlugin(new RealmFlipperPlugin(realmList));
```
The constructor for *RealmFlipperPlugin* accepts a list of objects, all of them are either a Realm object, or a Realm configuration object (the file used to create a Realm object).
# Documentation

- Communication
- Architecture

# Template Apps

# Analytics



# Contributing

# Code of Conduct

# License

# Feedback
