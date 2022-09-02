<picture>
    <source srcset="./logo-dark.svg" media="(prefers-color-scheme: dark)" alt="realm by MongoDB">
    <img src="./logo.svg" alt="realm by MongoDB">
</picture>

# Realm Flipper Plugin
This is a plugin for Flipper to debug Realm databases in react-native applications.

# Features
**Live Objects:** See objects in real time.

**Schema Dependency Graph:** View schemas and their relationships.

**Make changes:** Create, modify and delete objects

**Query:** Query the database using [RQL](https://www.mongodb.com/docs/realm/realm-query-language/)

# Getting Started
To add the Realm flipper plugin to your application, call the addPlugin with an instance of *RealmFlipperPlugin*:
```ts
import {addPlugin} from 'react-native-flipper';
import {RealmFlipperPlugin} from 'TODO';

let realmList: (Realm | Realm.Configuration)[];

...

addPlugin(new RealmFlipperPlugin(realmList));
```
The constructor for *RealmFlipperPlugin* accepts a list of objects, all of them are either a Realm object, or a Realm configuration object (the file used to create a Realm object).
# Documentation

- [Communication](/markdown/Communication.md)
- [Architecture](/markdown/Architecture.md)

# Template Apps


# Contributing

# Code of Conduct
This project adheres to the MongoDB Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to community-conduct@mongodb.com.

# License
Realm JS and Realm Core are published under the Apache License 2.0.

This product is not being made available to any person located in Cuba, Iran, North Korea, Sudan, Syria or the Crimea region, or to any other person that is not eligible to receive the product under U.S. law.

# Feedback
If you use Realm and are happy with it, all we ask is that you please consider sending out a tweet mentioning @realm to share your thoughts

And if you don't like it, please let us know what you would like improved, so we can fix it!
