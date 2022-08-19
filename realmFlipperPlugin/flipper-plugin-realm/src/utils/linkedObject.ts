import { SchemaProperty } from '../CommonTypes';

export const isPropertyLinked = (property: SchemaProperty) => {
  const primitiveTypes = new Set([
    'bool',
    'int',
    'float',
    'double',
    'string',
    'decimal128',
    'objectId',
    'date',
    'data',
    'list',
    'set',
    'dictionary',
    'linkingObjects',
  ]);

  return (
    property.objectType &&
    !primitiveTypes.has(property.objectType as string)
  );
};
