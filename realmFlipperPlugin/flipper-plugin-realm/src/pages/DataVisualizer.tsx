import React from "react";
import { Layout} from "flipper-plugin";
import { Radio, Table, Tooltip } from "antd";
import Prettyjson from "../components/Prettyjson";
import { SchemaResponseObject } from "../index";
<<<<<<< HEAD
import { createColumnConfig } from "../pages/SchemaVisualizer";
import ObjectAdder from "../components/ObjectAdder";
import SchemaSelect from "../components/SchemaSelect";
=======
import ObjectAdder from "../components/ObjectAdder";
>>>>>>> bf88fd7 (ellipsis in data table)

export default function DataVisualizer(props: {
  objects: Array<Object>;
  schemas: Array<SchemaResponseObject>;
  getObjects: Function;
  selectedSchema: String;
  addObject: Function;
}) {

  const getCurrentSchema = () => {
    return props.schemas.find(schema => schema.name === props.selectedSchema);
  }
  // State to switch between views. true = objectView, false = tableView
  const [objectView, setView] = useState(true);
  const getCurrentSchema = () => {
    return props.schemas.find((schema) => schema.name === props.selectedSchema);
  };


  // Return buttons + objectView or tableView
  return (
    <Layout.ScrollContainer>
      <Layout.Container>
        <Radio.Group>
          <Radio.Button onClick={() => setView(true)}>Object View</Radio.Button>
          <Radio.Button onClick={() => setView(false)}>Table View</Radio.Button>
<<<<<<< HEAD
          {<ObjectAdder schema={getCurrentSchema()} addObject={props.addObject}/>}
=======
          {
            <ObjectAdder
              schema={getCurrentSchema()}
              addObject={props.addObject}
            />
          }
>>>>>>> bf88fd7 (ellipsis in data table)
        </Radio.Group>
      </Layout.Container>
      <Layout.Container>
        <TableView />
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
        width: 150,     
        ellipsis: {
          showTitle: false,
        },

        render: (text) => {
          console.log("Tooltip: " + text);
          console.log(typeof text === "object" ? JSON.stringify(text) : text);

          return (
            <Tooltip
              placement="topLeft"
              title={JSON.stringify(text)}
              key={Math.floor(Math.random() * 10000000)}
            >
              {typeof text === "object" ? JSON.stringify(text) : text.toString()}
            </Tooltip>
          );
        },
        sorter: (a, b) => {
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
          pagination={{ position: ["topLeft", "bottomLeft"] }}
        />
      </Layout.Container>
    );
  }
}
