import { Button, Select, Modal, Layout, Tag, Input } from "antd";
import React, { useState } from "react";
import { getDefault, TypeInput, TypeInputProps } from "./TypeInput";

export const MixedInput = ({
  property,
  setter,
  value,
  inputReset,
  style,
  refresh
}: TypeInputProps) => {
  const [chosen, setChosen] = useState(false);
  const [visible, setVisible] = useState(false);

  const addObject = () => {
    console.log("addObject", value);
    setChosen(true);
    hideModal();
  };

  const hideModal = () => {
    setVisible(false);
  };

  const cancelWindow = () => {
    setter(null);
    setChosenType('string')
    hideModal();
  }

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
    setter(
      getDefault({
        type: v,
        optional: false,
        name: "",
        indexed: false,
        mapTo: "",
      })
    );
  };

  return (
    <>
      {chosen ? (
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
                {value.toString()}
              </div>
              <Tag
                style={{ float: "right", marginBottom: "10px", marginTop: -50 }}
                color="success"
              >
                {chosenType}
              </Tag>

              <Button size="small" onClick={() => {
                setter(null);
                setChosen(false)
              }}>
                clear
              </Button>
            </div>
          </Layout.Header>
        </Layout>
      ) : (
        <Layout>
          <Button
            onClick={() => {
              setVisible(true);
              setChosenType("string");
              //   setChosen(false);
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
                refresh={refresh}
              ></TypeInput>
            </Layout>
          </Modal>{" "}
        </Layout>
      )}
    </>
  );
};
