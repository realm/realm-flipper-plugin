//import {CanonicalObjectSchemaProperty} from 'realm';
export function isPropertyLinked(property: Object) {
    const primitiveTypes = new Set(["bool", "int", "float", "double", "string", "decimal128", "objectId", "date", "data", "list", "set", "dictionary", "linkingObjects"])

    return property.type === 'object' && !primitiveTypes.has(property.objectType);
}