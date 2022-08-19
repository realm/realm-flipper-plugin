import React from 'react';
import { RealmObject, SchemaObject, SchemaProperty } from '../CommonTypes';

export type DropdownPropertyType = {
  generateMenuItems: MenuItemGenerator;
  record: RealmObject;
  schemaProperty: SchemaProperty | null;
  currentSchema: SchemaObject;
  visible: boolean;
  x: number;
  y: number;
};

type MenuItem = {
  key: number;
  text: string;
  onClick: () => void;
};

export type MenuItemGenerator = (
  row: RealmObject,
  schemaProperty: SchemaProperty,
  schema: SchemaObject
) => Array<MenuItem>;

const generateListItems = (menuItems: Array<MenuItem>) => {
  return menuItems.map((menuItem) => (
    <li
      onClick={menuItem.onClick}
      key={menuItem.key}
      style={{
        clear: 'both',
        color: 'rgba(0, 0, 0, 0.65)',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'normal',
        lineHeight: '22px',
        margin: 0,
        padding: '5px 12px',
        whiteSpace: 'nowrap',
      }}
    >
      {' '}
      {menuItem.text}
    </li>
  ));
};

export const CustomDropdown = ({
  generateMenuItems,
  record,
  schemaProperty,
  currentSchema,
  visible,
  x,
  y,
}: DropdownPropertyType) => {
  if (visible && schemaProperty) {
    console.log('schemaProperty', schemaProperty);
    const menuItems = generateMenuItems(record, schemaProperty, currentSchema);
    return (
      <ul
        className="popup"
        style={{
          left: `${x}px`,
          top: `${y}px`,
          position: 'absolute',
          backgroundClip: 'padding-box',
          backgroundColor: '#fff',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          listStyleType: 'none',
          margin: 0,
          outline: 'none',
          padding: 0,
          textAlign: 'left',
          overflow: 'hidden',
        }}
      >
        {generateListItems(menuItems)}
      </ul>
    );
  } else return <></>;
};
