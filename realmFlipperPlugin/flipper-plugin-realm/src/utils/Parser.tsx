import { SchemaResponseObject } from "../index";

export function parseRows(
  objects: Object[],
  schema: SchemaResponseObject,
  schemas: Array<SchemaResponseObject>
): {}[] {
  let rows = objects.map((obj: any, index: number) => {
    let returnObj = { key: index };
    console.log(obj);

    Object.keys(schema.properties).forEach((propKey: string) => {

      const currentRealmPropType = schema.properties[propKey].type;
      const currentFieldValue = obj[propKey];

      if (currentFieldValue != null) {
        let stringForPrint: string = "";

        switch (currentRealmPropType) {
          case "string":
            stringForPrint + currentFieldValue;
            break;
          case "double":
          case "int":
          case "float":
          case "objectId":
          case "date":
          case "uuid":
            stringForPrint = currentFieldValue;
            break;
          case "list":
          case "set":
            stringForPrint = "[" + currentFieldValue + "]";
            break;
          case "data":
          case "dictionary":
            stringForPrint = JSON.stringify(currentFieldValue);
            break;
          case "bool":
            stringForPrint = currentFieldValue.toString();
            break;
          case "decimal128":
            stringForPrint = currentFieldValue.$numberDecimal;
            break;
          case "object":
            let childSchema = schemas.find(
              (s) => s.name === schema.properties[propKey].objectType
            );
            if (childSchema === undefined) {
              break;
            }
            stringForPrint =
              "[" +
              childSchema.name +
              "]" +
              "." +
              childSchema.primaryKey +
              " : " +
              currentFieldValue[childSchema.primaryKey];
            break;
          case "mixed":
            stringForPrint = JSON.stringify(currentFieldValue);
            break;
        }
        // @ts-ignore
        returnObj[propKey] = stringForPrint;
      }

      const currentPropObject = schema.properties[propKey];
      const currentRealmPropType = currentPropObject.type;
      const currentFieldValue = obj[propKey];

      console.log(schema.properties[propKey]);
if (currentFieldValue === undefined) {
    return;
}

      if (currentFieldValue === null) {
        //@ts-ignore
        returnObj[propKey] = "null";
        return;
      }

      let stringForPrint: string = "";

      switch (currentRealmPropType) {
        case "string":
          stringForPrint = parseString(currentFieldValue);
          break;
        case "double":
        case "int":
        case "float":
        case "objectId":
        case "date":
        case "uuid":
          stringForPrint = parseSimpleData(currentFieldValue);
          break;
        case "list":
        case "set":
          stringForPrint = parseSetOrList(currentFieldValue);
          break;
        case "data":
        case "dictionary":
          stringForPrint = parseDataOrDictionary(currentFieldValue);
          break;
        case "bool":
          stringForPrint = parseBoolean(currentFieldValue);
          break;
        case "decimal128":
          stringForPrint = parseDecimal128(currentFieldValue);
          break;
        case "object":
          stringForPrint = parseLinkedObject(
            schema,
            schemas,
            currentFieldValue,
            propKey
          );
          break;
        case "mixed":
          stringForPrint = JSON.stringify(currentFieldValue);
          break;
      }
      // @ts-ignore
      returnObj[propKey] = stringForPrint;

    });
    return returnObj;
  });
  return rows
}

function parseString(input: string): string {
  return input;
}

function parseSimpleData(input: string): string {
  return input;
}

function parseSetOrList(input: []): string {
  return "[" + input + "]";
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
  schema: SchemaResponseObject,
  schemas: Array<SchemaResponseObject>,
  linkedObj: {},
  key: string
): string {
  let stringForPrint = "";
  let childSchema: SchemaResponseObject | undefined = schemas.find(
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
