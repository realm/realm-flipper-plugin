import { Button, Select, Modal, Layout } from "antd";
import React, { useState } from "react";
import { getDefault, TypeInput, TypeInputProps } from "./CommonInput";

export const MixedInput = ({
  property,
  setter,
  value,
  inputReset,
  style,
}: TypeInputProps) => {
  const [visible, setVisible] = useState(false);

  const onChange = () => {
    setVisible(true);
  };

  const addObject = () => {};
  const hideModal = () => {
    setVisible(false);
  };
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
  // TODO: make it a list?
  const [chosenType, setChosenType] = useState("string");

  const onChangeSelect = (v: string) => {
    setChosenType(v);
    setter(getDefault({
        type: v,
        optional: false,
        name: "",
        indexed: false,
        mapTo: "",
    }));
  }
  
  return (
    <>
      <Button onClick={onChange}>Add mixed</Button>
      <Modal
        title={"Create mixed"}
        visible={visible}
        onOk={addObject}
        onCancel={hideModal}
        okText="Create"
        cancelText="Cancel"
      >
        <Layout>
          {"Select a type: "}
          <Select defaultValue={"string"} onChange={onChangeSelect}>
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
            setter={setter}
            value={value}
            inputReset={inputReset}
          ></TypeInput>
        </Layout>
      </Modal>
    </>
  );
};
