import {
  InputNumber,
  InputRef,
  Menu,
  Dropdown,
  Form,
  Input,
  Table,
} from "antd";
import type { FormInstance } from "antd/es/form";
import React, { useContext, useEffect, useRef, useState } from "react";
import { SchemaPropertyValue } from "..";

const EditableContext = React.createContext<FormInstance<any> | null>(null);

type Item = Object;

interface EditableRowProps {
  index: number;
}

const EditableRow: React.FC<EditableRowProps> = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

interface EditableCellProps {
  title: React.ReactNode;
  editable: boolean;
  children: React.ReactNode;
  dataIndex: keyof Item;
  record: Item;
  handleSave: (record: Item) => void;
  numeric: boolean;
}

const EditableCell: React.FC<EditableCellProps> = ({
  numeric,
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<InputRef>(null);
  const form = useContext(EditableContext)!;

  useEffect(() => {
    if (editing) {
      inputRef.current!.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({ [dataIndex]: record[dataIndex] });
  };

  const save = async () => {
    try {
      const values = await form.validateFields();

      toggleEdit();
      handleSave({ ...record, ...values });
    } catch (errInfo) {
      console.log("Save failed:", errInfo);
    }
  };

  let childNode = children;

  if (editable) {
    childNode = editing ? (
      <Form.Item style={{ margin: 0 }} name={dataIndex}>
        {!numeric ? (
          <Input
            style={{ width: "100%" }}
            ref={inputRef}
            onPressEnter={save}
            onBlur={save}
          />
        ) : (
          <InputNumber
            style={{ width: "100%" }}
            ref={inputRef as unknown as React.Ref<HTMLInputElement>}
            onPressEnter={save}
            onBlur={save}
          />
        )}
      </Form.Item>
    ) : (
      <div className="editable-cell-value-wrap" onClick={toggleEdit}>
        {children}
      </div>
    );
  }

  return <td {...restProps}>{childNode}</td>;
};

type EditableTableProps = Parameters<typeof Table>[0];

type ColumnTypes = Exclude<EditableTableProps["columns"], undefined>;

type GenericColumn = {
  title: string;
  key: string;
  dataIndex: string;
  property: SchemaPropertyValue;
};

export default (props: {
  columns: GenericColumn[];
  data: Object[];
  primaryKey: String;
  modifyObject: Function;
  schemaName: String;
  removeObject: Function;
}) => {
  const dataSource = props.data;

  const handleSave = (row: Item) => {
    // dont update for now
    // props.modifyObject(row);
  };

  const defaultColumns = props.columns.map((col) => {
    return {
      ...col,
      editable:
        col.property.type !== "data" && col.property.name != props.primaryKey,
    };
  });

  const deleteRow = (row: Item) => {
    props.removeObject(row);
  };

  const dropDown = (row: Item) => (
    <Menu>
      <Menu.Item key={1} onClick={() => deleteRow(row)}>
        Delete selected {props.schemaName}{" "}
      </Menu.Item>
    </Menu>
  );

  const renderValue = (
    value: any,
    property: SchemaPropertyValue,
    row: Item
  ) => {
    return (
      <Dropdown overlay={() => dropDown(row)} trigger={[`contextMenu`]}>
        <div>
          {property.optional && value === null
            ? "null"
            : property.type === "string"
            ? '"' + value + '"'
            : value}
        </div>
      </Dropdown>
    );
  };

  const columns = defaultColumns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: Item) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave,
        numeric: col.property.type === "int",
      }),
    };
  });

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };

  return (
    <div>
      <Table
        components={components}
        rowClassName={() => "editable-row"}
        bordered
        dataSource={dataSource}
        columns={columns as ColumnTypes}
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
    </div>
  );
};
