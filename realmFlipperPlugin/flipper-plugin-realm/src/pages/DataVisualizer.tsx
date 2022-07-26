import React from "react";
import { Layout } from "flipper-plugin";
import { Dropdown, Menu, Radio, Table, Tooltip, Tag } from "antd";
import { SchemaResponseObject } from "../index";
import ObjectAdder from "../components/ObjectAdder";
import { parseRows } from "../utils/Parser";
import EditableTable from "../components/EditableTable";

export default function DataVisualizer(props: {
  objects: Array<Object>;
  schemas: Array<SchemaResponseObject>;
  getObjects: Function;
  selectedSchema: String;
  addObject: Function;
  modifyObject: Function;
  removeObject: Function;
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

    const deleteRow = (row: Object) => {
      props.removeObject(row);
    };

    const dropDown = (row: Object) => (
      <Menu>
        <Menu.Item key={1} onClick={() => deleteRow(row)}>
          Delete selected {currentSchema.name}{" "}
        </Menu.Item>
      </Menu>
    );

    const columnObjs = Object.keys(currentSchema.properties).map((propName) => {
      const property = currentSchema.properties[propName];

      return {
        // title: property.optional
        //   ? property.name + " [" + property.type + "?]"
        //   : property.name + " [" + property.type + "]",

        title: () => {
          if (currentSchema.primaryKey === propName) {
            return (
              <div>
                {property.name + " [" + property.type + "] "}
                <Tag color="green" key="1">
                  Primary Key
                </Tag>
              </div>
            );
          } else if (property.optional) {
            return property.name + " [" + property.type + "?]";
          } else {
            return property.name + " [" + property.type + "]";
          }
        },

        key: property.name,
        dataIndex: property.name,
        ellipsis: {
          showTitle: false,
        },
        property,
        render: (text: any, row: Object) => {
          return (
            <Dropdown overlay={() => dropDown(row)} trigger={[`contextMenu`]}>
              <Tooltip
                placement="topLeft"
                title={text}
                key={Math.floor(Math.random() * 10000000)}
              >
                {text}
              </Tooltip>
            </Dropdown>
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

    const rowObjs = parseRows(props.objects, currentSchema, props.schemas);

    // Table properties need to be merged with EditableTable.
    //        <Table
    //          dataSource={rowObjs}
    //          columns={columnObjs}
    //          sticky={true}
    //          pagination={{
    //            position: ["topLeft", "bottomLeft"],
    //            defaultPageSize: 20,
    //            showSizeChanger: true,
    //            pageSizeOptions: ["10", "20", "30", "50", "100", "500"],
    //            showQuickJumper: true,
    //          }}
    //          size="small"
    //        />
    return (
      <Layout.Container height={800}>
        {/* <Table dataSource={rowObjs} columns={columns}/> */}
        {
          <EditableTable
            data={rowObjs}
            columns={columnObjs}
            primaryKey={currentSchema.primaryKey}
            modifyObject={props.modifyObject}
            schemaName={props.selectedSchema}
            removeObject={props.removeObject}
          ></EditableTable>
        }
      </Layout.Container>
    );
  }
}
