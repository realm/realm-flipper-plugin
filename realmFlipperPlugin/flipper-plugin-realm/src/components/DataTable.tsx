import React, { ReactElement, ReactNode } from "react";
import { Dropdown, Menu, Table, Tooltip } from "antd";
import { ColumnTitle } from "./ColumnTitle";
import { SchemaPropertyValue, SchemaResponseObject } from "..";
import { Layout } from "flipper-plugin";
import { parseRows } from "../utils/Parser";

type ColumnType = {
  isOptional: boolean;
  name: string;
  objectType: string | undefined;
  propertyType: string;
  isPrimaryKey: boolean;
};

export const DataTable = (props: {
  columns: ColumnType[];
  objects: Object[];
  schemas: SchemaResponseObject[];
  selectedSchema: string;
  renderOptions: (row: Object, schemaProperty: SchemaPropertyValue, schema: SchemaResponseObject) => ReactElement; // for dropDown
}) => {
  const currentSchema = props.schemas.find(
    (schema) => schema.name === props.selectedSchema
  );

  if (currentSchema === undefined) {
    return <Layout.Container>Please select schema.</Layout.Container>;
  }

  const filledColumns = props.columns.map((column) => {
    const property: SchemaPropertyValue = currentSchema.properties[column.name];

    const objectType: string | undefined = property.objectType;
    const isPrimaryKey: boolean = currentSchema.primaryKey === property.name;
    return {
      title: () => (
        <ColumnTitle
          isOptional={column.isOptional}
          name={column.name}
          objectType={column.objectType}
          propertyType={column.propertyType}
          isPrimaryKey={column.isPrimaryKey}
        />
      ),
      key: property.name,
      dataIndex: property.name,
      width: 300,
      ellipsis: {
        showTitle: false,
      },
      property,
      render: (text: any, row: Object) => {
        return (
          <Dropdown
            overlay={props.renderOptions(row, property, currentSchema)}
            trigger={[`contextMenu`]}
          >
            <Tooltip placement="topLeft" title={text.text}>
              {text.text}
            </Tooltip>
          </Dropdown>
        );
      },
    };
  });

  const rowObjs = parseRows(props.objects, currentSchema, props.schemas);

  // TODO: think about key as a property in the Realm DB
  return (
    <Table
      dataSource={rowObjs}
      columns={filledColumns}
    />
  );
};
