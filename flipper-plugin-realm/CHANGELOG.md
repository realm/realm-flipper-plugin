## v1.1.0

This version brings a number of major changes to plugin's functionality, improving the ability to display more complex types of Realm objects. Please make sure to update your `realm-flipper-plugin-device` to the new version as well to ensure compatibility. 

### Enhancements
* Referenced objects are now lazy-loaded. By default, they will display their object key and type (just for internal reference) and their actual values can be seen when they are inspected. This brings performance improvements when loading many objects with references as well as better support for circular and deeply nested references.
* Embedded object support.

### Fixed
* Objects with circular references displaying as undefined. ([#96](https://github.com/realm/realm-flipper-plugin/issues/96)).
* Clicking "Cancel" when modifying objects still changing the objects' local display state in the desktop plugin.

### Compatibility
* `realm` >= v11
* `realm-flipper-plugin-device` >= v1.1.0
