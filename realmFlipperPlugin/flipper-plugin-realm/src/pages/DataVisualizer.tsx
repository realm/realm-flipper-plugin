import React from "react";
import { Layout } from "flipper-plugin";
import { Radio, Table, Tooltip } from "antd";
import { SchemaResponseObject } from "../index";
import ObjectAdder from "../components/ObjectAdder";

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

  // Return buttons + objectView or tableView
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

        render: (text) => {
          return (
            <Tooltip
              placement="topLeft"
              title={
                typeof text === "object"
                  ? JSON.stringify(text)
                  : typeof text === "boolean"
                  ? text.toString()
                  : text
              }
              key={Math.floor(Math.random() * 10000000)}
            >
              {typeof text === "object"
                ? JSON.stringify(text)
                : typeof text === "boolean"
                ? text.toString()
                : text}
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
        onFilter: (value: string, record: any) =>
          record[propName].startsWith(value),
        filterSearch: true,
      };
    });

    const rowObjs = props.objects.map((obj, id) => {
      return {
        ...obj,
        key: id,
      };
    });

    return (
      <Layout.Container height={800}>
        <Table
          dataSource={rowObjs}
          columns={columnObjs}
          pagination={{
            position: ["topLeft", "bottomLeft"],
            defaultPageSize: 20,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "30", "50", "100", "500"],
            showQuickJumper: true
          }}
          size="small"
        />
      </Layout.Container>
    );
  }
}
