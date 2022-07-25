import { SchemaResponseObject } from "../index";

export function parseRows(
  objects: Object[],
  schema: SchemaResponseObject,
  schemas: Array<SchemaResponseObject>
) {
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
    });
    return returnObj;
  });
  return rows;
}
