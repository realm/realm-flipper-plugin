import {
  InputNumber,
  InputRef,
  Menu,
  Dropdown,
  Form,
  Input,
  Table,
  Pagination,
  TablePaginationConfig,
} from "antd";
import type { FormInstance } from "antd/es/form";
import { plugin } from '../index';
import { usePlugin, useValue } from "flipper-plugin";
import React, { useContext, useEffect, useRef, useState } from "react";
import { SchemaPropertyValue } from "..";
import { Key, RowSelectionType, SorterResult } from "antd/lib/table/interface";

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

const EditableTable = (props: {
  columns: GenericColumn[];
  data: Object[];
  primaryKey: string;
  modifyObject: Function;
  schemaName: string;
  removeObject: Function;
  loading: boolean;
}) => {
  const instance = usePlugin(plugin);
  const state = useValue(instance.state);
  const dataSource = props.data;

  const handleSave = (row: Item) => {
    // dont update for now
    // props.modifyObject(row);
  };

  const defaultColumns = props.columns.map((col) => {
    return {
      ...col,
      editable:
        col.property.type !== 'data' && col.property.name != props.primaryKey,
    };
  });

  const deleteRow = (row: Item) => {
    props.removeObject(row);
  };

  const dropDown = (row: Item) => (
    <Menu>
      <Menu.Item key={1} onClick={() => deleteRow(row)}>
        Delete selected {props.schemaName}{' '}
      </Menu.Item>
    </Menu>
  );

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
        numeric: col.property.type === 'int',
      }),
    };
  });

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };

  const handleOnChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, Key[] | null>,
    sorter: SorterResult<any> | SorterResult<any>[],
    extra: any
  ) => {
    //TODO: make type of a field
    console.log('ACTION', extra);
    if (extra.action === 'sort') {
      if (state.sortingColumn !== sorter.field) {
        console.log('swtiching');
        instance.setSortingDirection('ascend');
        instance.setSortingColumn(sorter.field);
      } else {
        console.log('standard');
        instance.toggleSortDirection();
      }
    }
    instance.getObjects({ realm: null, schema: null, goBack: false });
    instance.setCurrentPage({ currentPage: 1 });
  };

  return (
    <div>
      <Table
        components={components}
        rowClassName={() => 'editable-row'}
        bordered
        pagination={false}
        dataSource={dataSource}
        columns={columns as ColumnTypes}
        sticky={true}
        size="small"
        loading={props.loading}
        onChange={handleOnChange}
      />
    </div>
  );
};

export default EditableTable;