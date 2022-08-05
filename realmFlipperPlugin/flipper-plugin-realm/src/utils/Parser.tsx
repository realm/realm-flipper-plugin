import { SchemaObject } from "../index";

type propertyRepresentation = {
  value: any;
  text: string | number | null;
};

export function parseRows(
  objects: Object[],
  schema: SchemaObject,
  schemas: Array<SchemaObject>
) {
  console.log(schema);

  const rows: Array<Object> = objects.map((obj: any, index: number) => {
    // let returnObj = { text: {}, object: obj, key: index };
    const returnObj = { key: index };

    Object.keys(schema.properties).forEach((propKey: string) => {
      const currentPropObject = schema.properties[propKey];
      const currentRealmPropType = currentPropObject.type;
      const currentFieldValue = obj[propKey];

      const propRep: propertyRepresentation = {
        value: currentFieldValue,
        text: null,
      };
      returnObj[propKey] = propRep;

      if (currentFieldValue === undefined) {
        return;
      }

      if (currentFieldValue === null) {
        // @ts-ignore
        // returnObj.text[propKey] = "null";
        returnObj[propKey].text = 'null';
        return;
      }

      let stringForPrint = '';

      switch (currentRealmPropType) {
        case 'string':
        case 'double':
        case 'int':
        case 'float':
        case 'objectId':
        case 'date':
        case 'uuid':
          stringForPrint = parseSimpleData(currentFieldValue);
          break;
        case 'bool':
          stringForPrint = parseBoolean(currentFieldValue);
          break;
        case 'list':
        case 'set':
          stringForPrint = parseSetOrList(currentFieldValue);
          break;
        case 'data':
        case 'dictionary':
          stringForPrint = parseDataOrDictionary(currentFieldValue);
          break;
        case 'decimal128':
          stringForPrint = parseDecimal128(currentFieldValue);
          break;
        case 'object':
          stringForPrint = parseLinkedObject(
            schema,
            schemas,
            currentFieldValue,
            propKey
          );
          break;
        case 'mixed':
          stringForPrint = parseMixed(currentFieldValue);
          break;
      }
      // @ts-ignore
      //returnObj.text[propKey] = stringForPrint;
      returnObj[propKey].text = stringForPrint;
    });
    return returnObj;
  });

  return rows;
}

function parseSimpleData(input: string): string {
  return input;
}

function parseSetOrList(input: any[]): string {
  const output = input.map((value) => {
    return parseJavaScriptTypes(value);
  });

  return "[" + output + "]";
}

function parseDataOrDictionary(input: {}): string {
  return JSON.stringify(input);
}

function parseBoolean(input: boolean): string {
  return input.toString();
}

function parseDecimal128(input: { $numberDecimal: string }): string {
  return input.$numberDecimal;
}

function parseLinkedObject(
  schema: SchemaObject,
  schemas: Array<SchemaObject>,
  linkedObj: {},
  key: string
): string {
  let stringForPrint = "";
  const childSchema: SchemaObject | undefined = schemas.find(
    (s) => s.name === schema.properties[key].objectType
  );
  if (childSchema !== undefined) {
    stringForPrint =
      "[" +
      childSchema.name +
      "]" +
      "." +
      childSchema.primaryKey +
      ": " +
      //@ts-ignore
      linkedObj[childSchema.primaryKey];
  }

  return stringForPrint;
}

function parseMixed(input: any): string {
  return JSON.stringify(input);
}

function parseJavaScriptTypes(input: any): string {
  const type = typeof input;

  switch (type) {
    case "string":
    case "number":
    case "symbol":
      return parseSimpleData(input);
    case "boolean":
      return parseBoolean(input);
    case "object":
      if (Array.isArray(input)) {
        return parseSetOrList(input);
      } else if ("$numberDecimal" in input) {
        return input.$numberDecimal;
      } else {
        return parseMixed(input);
      }
    case "undefined":
    case "bigint":
    case "function":
    default:
      return input;
  }
}
