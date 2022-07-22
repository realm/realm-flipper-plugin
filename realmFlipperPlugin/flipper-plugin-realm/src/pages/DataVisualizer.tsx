import React from "react";
import { Layout } from "flipper-plugin";
import { Radio, Table, Tooltip } from "antd";
import { SchemaResponseObject } from "../index";
import ObjectAdder from "../components/ObjectAdder";

import { renderText } from "../utils/Renderer";

export default function DataVisualizer(props: {
  objects: Array<Object>;
  schemas: Array<SchemaResponseObject>;
  getObjects: Function;
  selectedSchema: String;
  addObject: Function;
}) {
  const getCurrentSchema = () => {
    return props.schemas.find((schema) => schema.name === props.selectedSchema);
  };

  // Return buttons + tableView
  return (
    <Layout.ScrollContainer>
      <Layout.Container>
        <Radio.Group>
          {
            <ObjectAdder
              schema={getCurrentSchema()}
              addObject={props.addObject}
            />
          }
        </Radio.Group>
      </Layout.Container>
      <Layout.Container>
        <TableView />
      </Layout.Container>
    </Layout.ScrollContainer>
  );

  function TableView() {
    const currentSchema = props.schemas.find(
      (schema) => schema.name === props.selectedSchema
    );

    if (currentSchema === undefined) {
      return <Layout.Container>Please select schema.</Layout.Container>;
    }

    const columnObjs = Object.keys(currentSchema.properties).map((propName) => {
      const property = currentSchema.properties[propName];

      return {
        title: property.optional
          ? property.name + " [" + property.type + "?]"
          : property.name + " [" + property.type + "]",
        key: property.name,
        dataIndex: property.name,
        width: 150,
        ellipsis: {
          showTitle: false,
        },

        render: (text: any) => {
          return (
            <Tooltip
              placement="topLeft"
              /**title={renderText(text)}*/
              title={text}
              key={Math.floor(Math.random() * 10000000)}
            >
              {/**renderText(text)*/}
              {text}
            </Tooltip>
          );
        },
        sorter: (a: any, b: any) => {
          if (a[propName] > b[propName]) {
            return 1;
          } else if (a[propName] < b[propName]) {
            return -1;
          } else {
            return 0;
          }
        },
      };
    });

    // const rowObjs = props.objects.map((obj, id) => {
    //   Object.keys(obj).forEach((x) =>
    //     console.log(x + ": " + obj[x] + " key: " + id)
    //   );
    //   return {
    //     ...obj,
    //     key: id,
    //   };
    // });

    const rowObjs = renderRows(props.objects, currentSchema, props.schemas);

    return (
      <Layout.Container height={800}>
        <Table
          dataSource={rowObjs}
          columns={columnObjs}
          sticky={true}
          pagination={{
            position: ["topLeft", "bottomLeft"],
            defaultPageSize: 20,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "30", "50", "100", "500"],
            showQuickJumper: true,
          }}
          size="small"
        />
      </Layout.Container>
    );
  }
}

function renderRows(
  objects: Object[],
  schema: SchemaResponseObject,
  schemas: Array<SchemaResponseObject>
) {
  const primaryKey = schema.primaryKey;
  const name = schema.name;

  let rows = objects.map((obj: any, index: number) => {
    let returnObj = { key: index };

    Object.keys(schema.properties).forEach((propKey: string) => {
      const currentRealmPropType = schema.properties[propKey].type;
      const currentFieldValue = obj[propKey];

      if (currentFieldValue != null) {
        let stringForPrint: string = "";

        switch (currentRealmPropType) {
          case "string":
          case "double":
          case "int":
          case "float":
          case "double":
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
        }
        returnObj[propKey] = stringForPrint;
      }
    });
    return returnObj;
  });
  return rows;
}
