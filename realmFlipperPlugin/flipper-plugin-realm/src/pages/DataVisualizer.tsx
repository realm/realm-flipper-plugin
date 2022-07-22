import React from "react";
import { useState } from "react";
import { Layout, DataTable, DataTableColumn, useMemoize } from "flipper-plugin";
import { Radio, Table } from "antd";
import Prettyjson from "../components/Prettyjson";
import { Value, renderValue } from "../utils/TypeBasedValueRenderer";
import { SchemaResponseObject } from "../index";
import ObjectAdder from "../components/ObjectAdder";
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
    return props.schemas.find(schema => schema.name === props.selectedSchema);
  }
  // Return buttons + objectView or tableView
  return (
    <Layout.ScrollContainer>
      <Layout.Container>
        { <TableView />}
      </Layout.Container>
    </Layout.ScrollContainer>
  );

  // Render objectView
  function ObjectView() {
    if (props.selectedSchema !== "") {
      // Map over all objects and genereate a Prettyjson component for each.
      return (
        <Layout.Container>
          {props.objects.map((obj) => {
            return (
              //@ts-ignore
              <Prettyjson key={obj._id} json={obj}>
                {" "}
              </Prettyjson>
            );
          })}
        </Layout.Container>
      );
    } else {
      return <Layout.Container>Please select schema.</Layout.Container>;
    }
  }

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
        title: property.name + " [" + property.type + "]",
        key: property.name,
        dataIndex: property.name,
        sorter: (a, b) => {
          if (a[propName] > b[propName]) {
            return 1;
          }
          else if (a[propName] < b[propName]) {
            return -1;
          }
          else {
            return 0;
          }
        },
        onFilter: (value: string, record: any) => record[propName].startsWith(value),
        filterSearch: true,
        property: property
      };
    });

    const rowObjs = props.objects.map((obj, id) => {
      return {
        ...obj,
        key: id
      }
    })

    return (
      <Layout.Container height={800}>
      {/* <Table dataSource={rowObjs} columns={columns}/> */}
      {<EditableTable data={rowObjs} columns={columnObjs} primaryKey={currentSchema.primaryKey} modifyObject={props.modifyObject} schemaName={props.selectedSchema} removeObject={props.removeObject}></EditableTable>}
      </Layout.Container>
    )
  }
}