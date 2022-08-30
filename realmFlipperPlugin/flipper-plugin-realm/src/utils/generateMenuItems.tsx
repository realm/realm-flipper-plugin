const generateMenuItems: MenuItemGenerator = (
  row: RealmObject,
  schemaProperty: SchemaProperty,
  schema: SchemaObject
) => [
  {
    key: 1,
    text: 'Inspect Object',
    onClick: () => {
      const object = {};
      Object.keys(row).forEach((key) => {
        object[key] = row[key];
      });
      handleDataInspector({
        data: {
          [schema.name]: object,
        },
        view: 'object',
      });
    },
  },
  {
    key: 2,
    text: 'Inspect Property',
    onClick: () => {
      handleDataInspector({
        data: {
          [schema.name + '.' + schemaProperty.name]: row[schemaProperty.name],
        },
        view: 'property',
      });
    },
  },
  {
    key: 3,
    text: 'Edit Object',
    onClick: () => editObject(row),
  },
  {
    key: 4,
    text: 'Edit Property',
    onClick: () => editField(row, schemaProperty),
  },
  {
    key: 5,
    text: 'Delete Object',
    onClick: () => deleteRow(row),
  },
];

