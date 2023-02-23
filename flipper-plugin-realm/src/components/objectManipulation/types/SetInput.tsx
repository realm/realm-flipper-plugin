import { DeleteOutlined } from "@ant-design/icons";
import { Button, Col, Row } from 'antd';
import { Layout } from "flipper-plugin";
import React, { useEffect, useState } from "react";
import { getDefault, TypeInput, CollectionInputProps } from './TypeInput';

export const SetInput = ({  property, set, defaultValue, isPrimary }:  CollectionInputProps) => {
  // TODO: Refactor this input file to ensure proper type safety of defaultValue and cleaner structure. Same in List.
  const [_, setReset] = useState(0);
  const [arr, setArr] = useState(defaultValue as unknown[] | undefined ?? []);
  const [occurences] = useState(new Map<unknown, number>());
  const [deleteOffset, setDeleteOffset] = useState(0);

  const [container] = useState(new Set());
  useEffect(() => {
    occurences.clear();
    (defaultValue ?? []).forEach(val => {
      occurences.set(val, 1);
      container.add(val);
    });
    setArr(defaultValue ?? []);
  }, []);
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
      if (occurences.get(prevValue)) {
        occurences.set(prevValue, (occurences.get(prevValue) || 0) - 1);
        if (occurences.get(prevValue) === 0) {
          occurences.delete(prevValue);
          container.delete(prevValue);
        }
      }

      container.add(val);
      set(Array.from(container.values()));
      arr[index] = val;
      setArr(arr);
      occurences.set(val, (occurences.get(val) || 0) + 1);
    }
  };

  const deleteRow = (index: number) => {
    const prevValue = arr[index];
    if (prevValue !== null) {
      occurences.set(prevValue, (occurences.get(prevValue) || 0) - 1);
      if (occurences.get(prevValue) == 0) {
        container.delete(prevValue);
        occurences.delete(prevValue);
      }
    }
    setArr(arr.filter((_, i) => i !== index));
    set(Array.from(container.values()));
  };

  return (
    <Layout.Container>
      {arr.map((value: any, index: number) => {
        const count = occurences.get(value) || 0;
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
                extraProps={{
                  style: { width: '100%' },
                  status: count < 2 ? '' : 'error',
                }}
                key={deleteOffset + index}
              ></TypeInput>
            </Col>
            <Col>
              <Button
                key={-index - 1}
                type="primary"
                disabled={isPrimary}
                icon={<DeleteOutlined />}
                // remove ith element
                onClick={() => {
                  setDeleteOffset((v) => v + arr.length);
                  deleteRow(index);
                  setReset((v) => v + arr.length + 2);
                }}
              />
            </Col>
          </Row>
        );
      })}
      <Button
        disabled={isPrimary}
        onClick={() => {
          const newVal = getDefault(innerProp);
          container.add(newVal);
          occurences.set(newVal, (occurences.get(newVal) || 0) + 1);
          
          setArr(arr => [...arr, newVal]);
          set(Array.from(container.values()));
        }}
      >
        Add {property.objectType}
      </Button>
    </Layout.Container>
  );
};
