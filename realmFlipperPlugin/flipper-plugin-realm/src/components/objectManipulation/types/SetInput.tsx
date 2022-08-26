import { DeleteOutlined } from "@ant-design/icons";
import { Button, Col, Layout, Row } from 'antd';
import React, { useEffect, useState } from "react";
import { getDefault, TypeInput, TypeInputProps } from './TypeInput';

export const SetInput = ({  property, set, defaultValue, isPrimary }: TypeInputProps) => {
  const [_, setReset] = useState(0);
  const [arr, setArr] = useState<any[]>(defaultValue as any[]);
  const [occurences] = useState(new Map<any, number>());
  const [deleteOffset, setDeleteOffset] = useState(0);

  const [container] = useState(new Set());
  useEffect(() => {
    (defaultValue as any[]).forEach(val => {
      occurences.set(val, 1);
    })
  }, [defaultValue]);  
  const typePointed = property.objectType;
  if (!typePointed) {
    return <></>;
  }

  const innerProp = {
    type: typePointed,
    name: "",
    indexed: false,
    mapTo: "",
    optional: property.optional,
  };
  console.log('innerProp', innerProp);
  const setRow = (val: any, index: number) => {
    const prevValue = arr[index];
    if (val === null && prevValue === null) {
      return;
    } else if (val === null) {
      occurences.set(prevValue, (occurences.get(prevValue) || 0) - 1);
      if (occurences.get(prevValue) === 0) {
        occurences.delete(prevValue);
        container.delete(prevValue);
      }
      arr[index] = null;
    } else {
      if (prevValue != null) {
        occurences.set(prevValue, (occurences.get(prevValue) || 0) - 1);
        if (occurences.get(prevValue) === 0) {
          occurences.delete(prevValue);
          container.delete(prevValue);
        }
      }

      container.add(val);
      set(Array.from(container.values()));
      arr[index] = val;
      occurences.set(val, (occurences.get(val) || 0) + 1);
    }
  };

  const deleteRow = (index: number) => {
    // console.log('deleteRow', occurences);
    const prevValue = arr[index];
    if (prevValue !== null) {
      occurences.set(prevValue, (occurences.get(prevValue) || 0) - 1);
      if (occurences.get(prevValue) == 0) {
        container.delete(prevValue);
        occurences.delete(prevValue);
      }
    }
    setArr(arr.filter((_, i) => i !== index));
    // console.log('deleteRow', occurences);
  };

  return (
    <Layout>
      {arr.map((value: any, index: number) => {
        const count = occurences.get(value) || 0;
        // console.log('index:', index, ' count is', count)
        return (
          <Row key={index}>
            <Col flex="auto">
            <TypeInput
              property={innerProp}
              isPrimary={isPrimary}
              set={(val) => {
                setRow(val, index);
                setReset((v) => v + 1);
              }}
              defaultValue={value}
              extraProps={{style: { width: '100%' }, status: (count < 2 ? '' : 'error') }}
              key={deleteOffset + index}
            ></TypeInput>
            </Col>
            <Col>
            <Button
              key={-index - 1}
              type="primary"
              icon={<DeleteOutlined />}
              // remove ith element
              onClick={() => {
                setDeleteOffset(v => v + arr.length)
                deleteRow(index);
                setReset((v) => v + arr.length + 2);
              }}
            />
            </Col>
          </Row>
        );
      })}
      <Button
        onClick={() => {
          // const val = getDefault(innerProp);
          const newVal = getDefault(innerProp);
          container.add(newVal);
          occurences.set(newVal, (occurences.get(newVal) || 0) + 1);
          setArr([...arr, newVal]);
        }}
      >
        Add {property.objectType}
      </Button>
    </Layout>
  );
};
