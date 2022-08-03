import { Button, Select, Modal, Layout, Tag, Input } from "antd";
import React, { useState } from "react";
import { getDefault, TypeInput, TypeInputProps } from "./TypeInput";

export const MixedInput = ({ property, set, style }: TypeInputProps) => {
  const [reset, setReset] = useState(0);
  const [chosen, setChosen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [chosenType, setChosenType] = useState("string");
  // let value: any = null;
  const [value, setValue] = useState<any>(null);
  // const [value, setValue] = useState(null);
  // console.log('mixedinput', value)

  const addObject = () => {
    // console.log("addObject", );
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
    // value = null;
    // setReset(v => v + 1)
  };

  const renderChosen = (
    <Layout>
      <Layout.Header style={{ paddingLeft: 0, paddingRight: 0 }}>
        <div
          style={{
            borderRadius: "5px",
            padding: "10px",
            backgroundColor: "#6D6B6A",
            height: "50px",
          }}
        >
          <div key={2} style={{ marginBottom: "10px", marginTop: -15 }}>
            {value?.toString()}
          </div>
          <Tag
            style={{ float: "right", marginBottom: "10px", marginTop: -50 }}
            color="success"
          >
            {chosenType}
          </Tag>

          <Button
            size="small"
            onClick={() => {
              set(null);
              setChosen(false);
            }}
          >
            clear
          </Button>
        </div>
      </Layout.Header>
    </Layout>
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
            setChosenType("string");
          }}
        >
          Set mixed
        </Button>
        <Modal
          // key={chosenType}
          title={"Set mixed"}
          visible={visible}
          onOk={addObject}
          onCancel={cancelWindow}
          okText="Create"
          cancelText="Cancel"
        >
          <Layout>
            {"Select a type: "}
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
              value={value}
            ></TypeInput>
          </Layout>
        </Modal>{" "}
      </Layout>
    );
  };

  return chosen ? renderChosen : renderSelector();
};
