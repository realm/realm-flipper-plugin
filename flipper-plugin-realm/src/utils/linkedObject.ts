import { CanonicalObjectSchemaProperty } from 'realm';

export const isPropertyLinked = (property: CanonicalObjectSchemaProperty) => {
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
    property.objectType && !primitiveTypes.has(property.objectType as string)
  );
};
