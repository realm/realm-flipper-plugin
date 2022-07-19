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
    if (props.selectedSchema !== "") {
      // Map over all objects and genereate a Prettyjson component for each.
      return (
        <Layout.Container>
          {"<" + props.selectedSchema + ">"}
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
  }

  // Render TableView
  function TableView() {
    // Find the selected schema in the schemas array. Take the keys of the schema and put them into an array.
    const currentSchema = props.schemas.find(
      (schema) => schema.name === props.selectedSchema
    );
    console.log("columnObjs:");
    columnObjs.forEach((x) => console.log(x));

    if (currentSchema != undefined) {
      // Genereate a list of column objects.
      const columnObjs = useMemoize(
        (currentSchema: SchemaResponseObject) =>
          createColumnConfigFromSchema(currentSchema),
        [currentSchema]
      );

      // Instantiate an array with row objects and fill it with data.
      const rows: Array<Object> = [];
      props.objects.forEach(function (obj: Object) {
        let rowObj: { [key: string]: Value } = {};
        columnObjs.forEach(function (c) {
          rowObj[c.key] = { type: typeof obj[c.key], value: obj[c.key] };
        });
        rows.push(rowObj);
      });

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
    } else {
      return <Layout.Container>Please select schema.</Layout.Container>;
    }

    function createColumnConfigFromSchema(
      schema: SchemaResponseObject
    ): Array<DataTableColumn> {
      const columnObjs: DataTableColumn<{ [key: string]: Value }>[] =
        Object.keys(schema.properties).map((c) => ({
          key: c,
          title: c + " [" + schema.properties[c].type + "]",
          onRender(row) {
            return renderValue(row[c]);
          },
        }));
      return columnObjs;
    }
  }
}
