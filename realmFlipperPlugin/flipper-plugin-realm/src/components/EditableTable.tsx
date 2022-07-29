import {
  InputNumber,
  InputRef,
  Menu,
  Dropdown,
  Form,
  Input,
  Table,
  Pagination,
} from "antd";
import type { FormInstance } from "antd/es/form";
import { plugin } from '../index';
import { usePlugin, useValue } from "flipper-plugin";
import React, { useContext, useEffect, useRef, useState } from "react";
import { SchemaPropertyValue } from "..";

const EditableContext = React.createContext<FormInstance<any> | null>(null);

type Item = Object

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
      <Form.Item
        style={{ margin: 0 }}
        name={dataIndex}
      >
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
}

export default (props: {
  columns: GenericColumn[];
  data: Object[];
  primaryKey: String;
  modifyObject: Function;
  schemaName: String;
  removeObject: Function;
}) => {
  const instance = usePlugin(plugin);
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
      width: ((1 / props.columns.length) * 100).toFixed(2) + "%",
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

  const renderValue = (value: any, property: SchemaPropertyValue, row: Item) => {
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

  const columns = defaultColumns.map((oldCol) => {
    let col = {
      ...oldCol,
      render: (val: any, row: Item) => renderValue(val, col.property, row),
    };
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

  const handleOnChange = (pagination, filters, sorter, extra) => {
    if (extra.action === 'sort') {
      instance.setSortingColumn({sortingColumn: sorter.field})
    }
    instance.getObjects({realm: null, schema: null});
  };

  return (
    <div>
      <Table
        components={components}
        rowClassName={() => "editable-row"}
        bordered
        pagination={false}
        dataSource={dataSource}
        columns={columns as ColumnTypes}
        onChange = {handleOnChange}
      />
    </div>
  );
};
