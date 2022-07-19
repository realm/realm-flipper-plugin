import React from "react";
import { useState } from "react";
import { Layout, DataTable,DataTableColumn, useMemoize } from "flipper-plugin";
import { Radio } from "antd";
import Prettyjson from "../components/Prettyjson";
import { Value, renderValue } from "../utils/TypeBasedValueRenderer";
import { SchemaResponseObject } from "../index";
import { createColumnConfig } from "../pages/SchemaVisualizer";
import SchemaSelect from "../components/SchemaSelect";

export default function DataVisualizer(props: {
  objects: Array<Object>;
  schemas: Array<SchemaResponseObject>;
  getObjects: Function;
  selectedSchema: String;
}) {
  // State to switch between views. true = objectView, false = tableView
  const [objectView, setView] = useState(true);

  // Return buttons + objectView or tableView
  return (
    <Layout.ScrollContainer>
      <Layout.Container>
        <Radio.Group>
          <Radio.Button onClick={() => setView(true)}>Object View</Radio.Button>
          <Radio.Button onClick={() => setView(false)}>Table View</Radio.Button>
        </Radio.Group>
      </Layout.Container>
      <Layout.Container>
        {objectView ? <ObjectView /> : <TableView />}
      </Layout.Container>
    </Layout.ScrollContainer>
  );

  // Render objectView
  function ObjectView() {
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
  }

  // Render TableView
  function TableView() {
    // Find the selected schema in the schemas array. Take the keys of the schema and put them into an array.
    const currentSchema = props.schemas.find(
      (schema) => schema.name === props.selectedSchema
    );
    const columnsMap = new Map(
      Object.keys(currentSchema.properties).map((x) => {
        return [x, "[" + currentSchema.properties[x].type + "]"];
      })
    );

    console.log("columnsMap: " + columnsMap);
    columnsMap.forEach((value, key) => console.log(key + " " + value));

    //const columnStrings = Array.from (columnsMap.keys())
    //const columnStrings = Map.entries(columnsMap).map(([key, value]) => {return (key + ' ' + columnsMap.get(key))})
    var columnStrings: string[] = [];
    columnsMap.forEach((value, key) => columnStrings.push(key + " " + value));

    console.log("columnStrings: " + columnStrings);

    columnStrings.forEach((x) => console.log(x));

    // Genereate a list of column objects.
    const columnObjs: Array<Object> = useMemoize(
      (columnStrings: string[]) => createColumnConfig(columnStrings),
      [columnStrings]
    );
    console.log("columnObjs:");
    columnObjs.forEach((x) => console.log(x));

    // Instantiate an array with row objects and fill it with data.
    const rows: Array<Object> = [];
    props.objects.forEach(function (obj: Object) {
      let rowObj: { [key: string]: Value } = {};
      columnsMap.forEach(function (value, key) {
        rowObj[key] = { type: typeof obj[key], value: obj[key] };
      });
      rows.push(rowObj);
    });

    console.log("rows:");
    rows.forEach((x) => console.log(x));


    // Render a data table and return it.
    return (
      <Layout.Container height={800}>
        <DataTable<{ [key: string]: Value }>
          records={rows}
          columns={columnObjs}
          enableSearchbar={false}
        />
      </Layout.Container>
    );

    function createColumnConfig(columns: string[]) {
      const columnObjs: DataTableColumn<{[key: string]: Value}>[] = columns.map(
        (c) => ({
          key: c,
          title: c,
          onRender(row) {
            // ToDo: super hacky solution. Refine late.
            return renderValue(row[c.substring(0, c.indexOf(" "))]);
          },
        }),
      );
      return columnObjs;
    }
  }
}
