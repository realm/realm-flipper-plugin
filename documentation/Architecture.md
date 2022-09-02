
# Architecture

On a high level the Realm Flipper Plugin consists of the desktop plugin and the mobile plugin on the device which communicate using Remote Procedure Calls (RPC). In the following we take a closer look at these components and explain how they work on the inside.

# Desktop Plugin

## Plugin API and State (index.tsx)

The index file is the central component of the desktop plugin. It contains the plugin function which defines the plugin API for the Realm Flipper Plugin. It carries the pluginState and a multitude of functions for communication with the mobile plugin, e.g. getSchemas() or executeQuery(). These are either called from other components of the desktop plugin or executed when an RPC from the mobile plugin is received. These functions trigger RPC calls with client.send() and define how the response from the mobile device is handled. Usually the pluginState is updated with the received information (Read more about this in [Communication.md](Communication.md))
The pluginState contains data, e.g. regarding Realms, objects and schemas. The plugin API and pluginState are exposed using Flippers usePlugin() hook. This hook is used in multiple other components.

## React entry point (index.tsx)

Besides the plugin the index file contains the functional component with the name Component() which is the entry point of the React front-end application. It returns JSX components for the three different tabs of the plugin as well the header.

## DataVisualizer

The DataVisualizer ([.tsx](../realmFlipperPlugin/flipper-plugin-realm/src/pages/DataVisualizer.tsx)) is the core component of the data tab. It is implemented in index.tsx with a DataVisualizerWrapper ([.tsx](../realmFlipperPlugin/flipper-plugin-realm/src/components/DataVisualizerWrapper.tsx)) which adds a SchemaSelect ([.tsx](../realmFlipperPlugin/flipper-plugin-realm/src/components/SchemaSelect.tsx)) and the DataTabHeader ([.tsx](../realmFlipperPlugin/flipper-plugin-realm/src/components/DataTabHeader.tsx)) for querying and creating objects.

The main responsibility of the DataVisualizer is to render the [DataTable](#datatable) ([.tsx](../realmFlipperPlugin/flipper-plugin-realm/src/components/DataTable.tsx)) showing the Realm objects of the selected schema and the selected Realm. Besides this, it contains functions and state for rendering and hiding the RealmDataInspector and the Dropdown Menu

### DataTable

The DataTable uses the [Ant Design Table](https://ant.design/components/table/) (antd table) to display data but adds extra functions for the use context of visualizing Realm objects. 

#### antdColumns and schemaObjToColumns()

The function schemaObjToColumns() takes a schema object as argument and returns an array of column objects. The column objects contain general information about each column for example if it a primary key column, what the name of the column should be and what datatype the contents have. These are used later to create antd specific column objects (antdColumns) to be passed to the antd table.

#### Rendering Cells

The function render() inside the antdColumns contains the logic defining how each cell is rendered. In a standard case it applies the renderValue() function which returns a basic text based on the property to be rendered. In case the cell contains a linked Realm object buttons are rendered in addition and the text is made clickable. If the string is long it is cut off and also a clickable text is rendered to see the full value of the cell.

#### Nested Tables

A special functionality of the antd table are [expandable rows](https://ant.design/components/table/#components-table-demo-expand) to render extra content underneath. In the DataTable this feature is used for traversing linked objects by rendering a nested table underneath the respective row. This behaviour is handled by setting the 'expandable' property of the antd table. For this a useState hook ([rowExpansionProp, setRowExpansionProp]) is used which is updated when the button for expanding a row is clicked or the nested table is closed by clicking outside of it.

### Querying

The query functionality is implemented into the DataTabHeader ([.tsx](../realmFlipperPlugin/flipper-plugin-realm/src/components/DataTabHeader.tsx)) by the RealmQueryInput component ([.tsx](../realmFlipperPlugin/flipper-plugin-realm/src/components/Query.tsx)). It makes use of the executeQuery() function in the plugin API to execute the entered query. The result of the query is saved by updating the state. If an error occurs, it is propagated to the user using an alert.

### Dropdown Menu

The dropdown menu is rendered inside the DataVisualizer. The component CustomDropdown ([.tsx](../realmFlipperPlugin/flipper-plugin-realm/src/components/CustomDropdown.tsx)) defines a generic dropdown. Its menu items are specified using a property. The dropdown is opened in the DataTable inside the onCell property of the antdColumns and closed in the DataInspector by listening to a click event.

### Adding, editing and deleting fields and objects

The DataVisualizer makes use of the components FieldEdit ([.tsx](../realmFlipperPlugin/flipper-plugin-realm/src/components/objectManipulation/FieldEdit.tsx)) and ObjectEdit ([.tsx](../realmFlipperPlugin/flipper-plugin-realm/src/components/objectManipulation/ObjectEdit.tsx)) to manipulate data in the database. These are managed using useState hooks and triggered from the dropdown menu.
Also for deleting objects the context menu is used in order to call the removeObject function in the plugin API. Through an RPC call the respective object is deleted and the UI is updated. 

### RealmDataInspector

The RealmDataInspector ([.tsx](../realmFlipperPlugin/flipper-plugin-realm/src/components/RealmDataInspector.tsx)) is used to explore data in the sidebar in JSON format. It is used in the DataVisualizer which also manages its state. The RealmDataInspector makes use of Flippers DataInspector.

Note:
A usage example of the DataInspector can be found [here](https://fbflipper.com/docs/tutorial/js-custom/). During the development of this proof-of-concept the DataInspector was not documented on the Flipper website. In the future it might get documented [here](https://fbflipper.com/docs/extending/flipper-plugin/#datainspector).

## SchemaVisualizer

## SchemaGraph


# Mobile Plugin

