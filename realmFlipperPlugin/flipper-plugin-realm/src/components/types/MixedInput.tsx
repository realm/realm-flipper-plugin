import { ClearOutlined } from "@ant-design/icons";
import { Button, Col, Layout, Modal, Row, Select, Tag } from 'antd';
import React, { useState } from "react";
import { getDefault, TypeInput, TypeInputProps } from "./TypeInput";

export const MixedInput = ({ set, extraProps }: TypeInputProps) => {
  const [reset, setReset] = useState(0);
  const [chosen, setChosen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [chosenType, setChosenType] = useState("string");
  const [value, setValue] = useState<any | undefined>();

  const addObject = () => {
    set(value);
    setReset((v) => v + 1);
    setChosen(true);
    hideModal();
  };

  const hideModal = () => {
    setVisible(false);
  };

  const cancelWindow = () => {
    set(null);
    setValue(null);
    setChosenType("string");
    setReset((v) => v + 1);
    hideModal();
  };

  const onChangeSelect = (v: string) => {
    setChosenType(v);
    setValue(getDefault({
      type: v,
      optional: false,
      name: "",
      indexed: false,
      mapTo: "",
    }));
  };

  const renderChosen = (
      <Row style={{ backgroundColor: 'white' }} align="middle">
        <Col flex="auto">
        <Tag color="success">
            {chosenType}
        </Tag>
          {value?.toString()}
        </Col>
        <Col>
        <Button
              icon={<ClearOutlined />}
              onClick={() => {
              set(null);
              setChosen(false);
              setValue(null);
            }}
          >
          </Button>
        </Col>
      </Row>
  );

  const renderSelector = () => {
    const typeList = [
      "objectId",
      "uuid",
      "bool",
      "int",
      "float",
      "double",
      "decimal128",
      "string",
      "data",
      "date",
    ];

    // set(getDefault({ type: chosenType, indexed: false, optional: false, mapTo: '', name: '' }))

    return (
      <Layout>
        <Button
          onClick={() => {
            setVisible(true);
            onChangeSelect('string');
          }}
        >
          Set a value
        </Button>
        <Modal
          title={"Set mixed"}
          visible={visible}
          onOk={addObject}
          onCancel={cancelWindow}
          okText="Create"
          cancelText="Cancel"
        >
          <Layout>
            <div style={{ backgroundColor: 'white'}}>
            Select a type:
            </div>
            <Select
              defaultValue={"string"}
              onChange={onChangeSelect}
              key={reset}
            >
              {typeList.map((item, index) => {
                return (
                  <Select.Option value={item} key={index}>
                    {item}
                  </Select.Option>
                );
              })}
            </Select>
            <TypeInput
              property={{
                type: chosenType,
                optional: false,
                name: "",
                indexed: false,
                mapTo: "",
              }}
              set={(val: any) => {
                setValue(val);
              }}
              defaultValue={value}
              extraProps={{ style: {width: '100%'} }}
            ></TypeInput>
          </Layout>
        </Modal>{" "}
      </Layout>
    );
  };

  return chosen ? renderChosen : renderSelector();
};
