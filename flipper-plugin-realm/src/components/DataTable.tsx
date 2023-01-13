import { PlusOutlined } from '@ant-design/icons';
import { Button, Table } from 'antd';
import {
  ColumnsType,
  ExpandableConfig,
  SorterResult,
} from 'antd/lib/table/interface';
import { Layout, Spinner, usePlugin, useValue } from 'flipper-plugin';
import React, { useEffect, useState } from 'react';
import { plugin } from '..';
import InfiniteScroll from 'react-infinite-scroller';
import { InspectionDataType } from './RealmDataInspector';
import { renderValue } from '../utils/Renderer';
import { ColumnTitle } from './ColumnTitle';
import { DropdownPropertyType, MenuItemGenerator, PlainRealmObject, DeserializedRealmObject, SortedObjectSchema, RealmObjectReference } from '../CommonTypes';

export type ColumnType = {
  optional: boolean;
  name: string;
  objectType?: string;
  type: string;
  isPrimaryKey: boolean;
};


type DataTableProps = {
  objects: DeserializedRealmObject[];
  schemas: SortedObjectSchema[];
  currentSchema: SortedObjectSchema;
  sortingDirection: 'ascend' | 'descend' | null;
  sortingColumn: string | null;
  generateMenuItems?: MenuItemGenerator;
  style?: Record<string, unknown>;
  dropdownProp: DropdownPropertyType;
  setdropdownProp: React.Dispatch<React.SetStateAction<DropdownPropertyType>>;
  scrollX: number;
  scrollY: number;
  enableSort: boolean;
  hasMore: boolean;
  totalObjects?: number;
  fetchMore: () => void;
  setNewInspectionData: (
    inspectionData: InspectionDataType,
    wipeStacks?: boolean,
  ) => void;
  clickAction?: (object: DeserializedRealmObject) => void;
  getObject: (object: RealmObjectReference, objectSchemaName: string) => Promise<DeserializedRealmObject | null>;
};

type ClickableTextProps = {
  /** Content to be displayed for the given value. */
  displayValue: string | number | JSX.Element;
  isLongString: boolean;
  value: PlainRealmObject | RealmObjectReference;
  isReference?: boolean;
  inspectorView: 'object' | 'property';
};

// Receives a schema and returns column objects for the table.
const schemaObjectToColumns = (
  schema: SortedObjectSchema,
): ColumnType[] => {
  return schema.order.map((propertyName) => {
    const obj = schema.properties[propertyName];
    const isPrimaryKey = obj.name === schema.primaryKey;
    return {
      name: obj.name,
      optional: obj.optional,
      objectType: obj.objectType,
      type: obj.type,
      isPrimaryKey: isPrimaryKey,
    };
  });
};

export const DataTable = (dataTableProps: DataTableProps) => {
  const {
    objects,
    schemas,
    currentSchema,
    generateMenuItems,
    setdropdownProp,
    dropdownProp,
    scrollX,
    scrollY,
    setNewInspectionData,
    enableSort,
    hasMore,
    totalObjects = 0,
    fetchMore = () => undefined, 
    clickAction,
    getObject,
  } = dataTableProps;
  const instance = usePlugin(plugin);
  const state = useValue(instance.state);
  const sortableTypes = new Set([
    'string',
    'int',
    'uuid',
    'date',
    'decimal128',
    'decimal',
    'float',
    'bool',
  ]);

  const [rowExpansionProp, setRowExpansionProp] = useState({
    expandedRowRender: () => {
      return <></>;
    },
    expandedRowKeys: [],
    showExpandColumn: false,
  } as ExpandableConfig<DeserializedRealmObject>);

  /** Hook to close the nested Table when clicked outside of it. */
  useEffect(() => {
    const closeNestedTable = () => {
      setRowExpansionProp({ ...rowExpansionProp, expandedRowKeys: [] });
    };
    document.body.addEventListener('click', closeNestedTable);
    return () => document.body.removeEventListener('click', closeNestedTable);
  }, []);

  if (!currentSchema) {
    return <Layout.Container style={{padding: 20}}>Please select schema.</Layout.Container>;
  }

  if (currentSchema.embedded) {
    return <Layout.Container style={{padding: 20}}>Embedded objects cannot be queried. Please view them from their parent schema or select a different schema.</Layout.Container>;
  }

  if (!schemas || !schemas.length) {
    return <Layout.Container style={{padding: 20}}>No schemas found. Check selected Realm.</Layout.Container>;
  }

  /**  Functional component to render clickable text which opens the DataInspector.*/
  const ClickableText = ({
    displayValue,
    isLongString,
    value,
    inspectorView,
    isReference = false,
  }: ClickableTextProps) => {
    const [isHovering, setHovering] = useState(false);
    return (
      <div>
        <div
          style={{
            display: 'inline',
            color: isLongString ? undefined : '#6831c7',
            textDecoration: isHovering ? 'underline' : undefined,
          }}
          onClick={() => {
            setNewInspectionData({ data: value, view: inspectorView, isReference }, true);
          }}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          {displayValue}
        </div>
        {isLongString ? (
          <div
            style={{
              display: 'inline',
            }}
          >
            ...
          </div>
        ) : null}
      </div>
    );
  };

  /** Definition of antd-specific columns. This constant is passed to the antd table as a property. */
  const antdColumns:ColumnsType<DeserializedRealmObject> = schemaObjectToColumns(currentSchema).map((column) => {
    const property: Realm.CanonicalObjectSchemaProperty =
      currentSchema.properties[column.name];
    const linkedSchema = schemas.find(
      (schema) => property && schema.name === property.objectType,
    );
    /*  A function that is applied for every cell to specify what to render in each cell
      on top of the pure value specified in the 'dataSource' property of the antd table.*/
    const render = (value: PlainRealmObject | RealmObjectReference, row: DeserializedRealmObject) => {
      /** Apply the renderValue function on the value in the cell to create a standard cell. */
      const cellValue = renderValue(value, property, schemas);

      /** Render buttons to expand the row and a clickable text if the cell contains a linked or embedded Realm object. */
      if (value !== null && linkedSchema && property.type === 'object') {
        const isEmbedded = linkedSchema.embedded;

        return (
          <Layout.Container
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '5px',
            }}
          >
          {/* Embedded objects cannot be queried in the row. */
          !isEmbedded && <Button
              shape="circle"
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={async (event) => {
                event.stopPropagation();
                // Fetch the linked object and if found, expand the table with the row.
                let linkedObject = await getObject(value as RealmObjectReference, linkedSchema.name)
                if(linkedObject) {
                  expandRow(
                    row.objectKey,
                    linkedSchema,
                    linkedObject,
                  );
                }
              }}
              ghost
            />}
            {
              <ClickableText
                value={
                  isEmbedded 
                  ? { [`${currentSchema.name}.${column.name}`]: value}
                  : value
                }
                displayValue={cellValue}
                isLongString={false}
                inspectorView={isEmbedded ? "property" : "object"}
                isReference={!isEmbedded}
              />
            }
          </Layout.Container>
        );
      }

      /** If the cell contains a string which is too long cut it off and render it as a clickable text. */
      if (typeof cellValue === 'string' && cellValue.length > 70) {
        return (
          <ClickableText
            value={value}
            displayValue={cellValue.substring(0, 70)}
            isLongString={true}
            inspectorView="property"
          />
        );
      }
      return cellValue;
    };

    return {
      /** Simple antd table props defined in their documentation */
      minWidth: 20000,
      key: property.name,
      dataIndex: ["realmObject", property.name],
      width: 300,
      ellipsis: {
        showTitle: false,
      },

      /** The title appearing in the tables title row. */
      title: createTitle(column),

      /** The function that defines how each cell is rendered. */
      render,

      property,

      /** The function listening for onCell events, here listening for left-clicks on the cell to render the context menu.*/
      onCell: (object: DeserializedRealmObject) => {
        if (generateMenuItems) {
          return {
            onContextMenu: (env: React.MouseEvent) => {
              env.preventDefault();
              setdropdownProp({
                ...dropdownProp,
                record: object,
                schemaProperty: property,
                currentSchema: currentSchema,
                visible: true,
                pointerX: env.clientX - 290,
                pointerY: env.clientY - 225,
                scrollX,
                scrollY,
              });
            },
          };
        }
        return {}
      },

      /** Enabling/Disabling sorting if the property.type is a sortable type */
      sorter: enableSort && sortableTypes.has(property.type),

      /** Defining the sorting order. */
      sortOrder:
        state.sortingColumn === property.name ? state.sortingDirection : null,
    };
  });

  /** Updating the rowExpansion property of the antd table to expand the correct row and render a nested table inside of it. */
  const expandRow = (
    rowToExpandKey: any,
    linkedSchema: SortedObjectSchema,
    objectToRender: DeserializedRealmObject,
  ) => {
    const newRowExpansionProp = {
      ...rowExpansionProp,
      expandedRowKeys: [rowToExpandKey],
      expandedRowRender: () => {
        return (
          <NestedTable
            { ...dataTableProps }
            objects={[objectToRender]}
            currentSchema={linkedSchema}
          />
        );
      },
    };
    setRowExpansionProp(newRowExpansionProp);
  };

  /** Loading new objects if the end of the table is reached. */
  const handleInfiniteOnLoad = () => {
    if (state.loading) {
      return;
    }
    if (objects.length >= totalObjects) {
      return;
    }
    fetchMore();
  };

  /** Handling sorting. Is called when the 'state' of the Ant D Table changes, ie. you sort on a column. */
  const handleOnChange = (
    sorter: SorterResult<any> | SorterResult<any>[],
    extra: any,
  ) => {
    if (extra.action === 'sort') {
      if (state.loading) {
        return;
      }
      // TODO: properly handle SorterResult<any>[] case
      const sortedField = Array.isArray(sorter) ? sorter[0].field : sorter.field

      if (state.sortingColumn !== sortedField) {
        instance.setSortingDirection('ascend');

        instance.setSortingColumn(sortedField as string);
      } else {
        instance.toggleSortingDirection();
      }
      instance.getObjects();
    }
  };
  return (
    <div
      style={{
        overflow: 'auto',
        height: '90%',
        width: '100%',
        textAlign: 'center',
      }}
    >
      <InfiniteScroll
        initialLoad={false}
        pageStart={0}
        loadMore={handleInfiniteOnLoad}
        hasMore={state.loading && hasMore}
        useWindow={false}
        loader={
          <div
            style={{
              marginTop: '20px',
              marginBottom: '25px',
              display: 'inline-block',
              paddingBottom: '100px',
            }}
            key={0}
          >
            <Spinner size={30} />
          </div>
        }
      >
        <Table
          sticky={true}
          bordered={true}
          showSorterTooltip={false}
          dataSource={objects}
          onRow={(object: DeserializedRealmObject) => {
            if (clickAction) {
              return {
                onClick: () => {
                  clickAction(object);
                },
              };
            }
            return {}
          }}
          rowKey={(record) => {
            return record.objectKey;
          }}
          expandable={rowExpansionProp}
          columns={antdColumns}
          onChange={(_, __, sorter, extra) => handleOnChange(sorter, extra)}
          pagination={false}
          scroll={{ scrollToFirstRowOnChange: false }}
        />
      </InfiniteScroll>
    </div>
  );
};

const createTitle = (column: ColumnType) => {
  return (
    <ColumnTitle
      optional={column.optional}
      name={column.name}
      objectType={column.objectType}
      type={column.type}
      isPrimaryKey={column.isPrimaryKey}
    />
  );
};

/** Internal component to render a nested table for exploring linked objects. */
const NestedTable = (props: DataTableProps) => {
  return (
    <div
      style={{
        boxShadow: '0px 0px 15px grey',
      }}
    >
      <DataTable {...props} />
    </div>
  );
};
