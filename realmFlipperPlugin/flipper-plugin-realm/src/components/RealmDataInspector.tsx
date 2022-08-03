import React, { useState } from "react";
import { DataInspector, DetailSidebar } from "flipper-plugin";
import { Radio, Tooltip, Button } from "antd";
import {
  SearchOutlined,
  CloseCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
} from "@ant-design/icons";
import { SchemaResponseObject } from "..";

type PropsType = {
  currentSchema: SchemaResponseObject;
  schemas: SchemaResponseObject[];
  inspectData?: Object;
  setInspectData: (value: Object) => void;
  showSidebar: boolean;
  setShowSidebar: (value: boolean) => void;
  goBackStack: Array<Object>,
  setGoBackStack: (value: Array<Object>) => void;
  goForwardStack: Array<Object>;
  setGoForwardStack: (value: Array<Object>) => void;
  setNewInspectData: (value: Array<Object>) => void;
};

export const RealmDataInspector = ({
  currentSchema,
  schemas,
  inspectData,
  setInspectData,
  showSidebar,
  setShowSidebar,
  goBackStack,
  setGoBackStack,
  goForwardStack,
  setGoForwardStack,
  setNewInspectData

}: PropsType) => {
  if (!showSidebar) return null;

  console.log("goForwardStack");
  console.log(goForwardStack);
  console.log("goBackStack");
  console.log(goBackStack);

  return (
    <DetailSidebar>
      <div>Inspector</div>
      <Radio.Group>
        <Button
          icon={<CloseCircleOutlined />}
          onClick={() => setShowSidebar(false)}
        />

        <Button
          icon={<StepBackwardOutlined />}
          onClick={() => goBackInspector()}
        />
        <Button
          icon={<StepForwardOutlined />}
          onClick={() => goForwardInspector()}
        />
      </Radio.Group>
      <DataInspector
        data={inspectData}
        expandRoot={true}
        collapsed={true}
        onRenderName={(path, name) => {
          let linkedSchema = undefined;
          if (
            currentSchema !== undefined &&
            currentSchema.properties[name] !== undefined &&
            "objectType" in currentSchema.properties[name]
          ) {
            console.log(currentSchema?.properties[name].objectType);

            linkedSchema = schemas.find(
              (schema) =>
                schema.name === currentSchema?.properties[name].objectType
            );
          }

          if (linkedSchema !== undefined) {
            return (
              <>
                {name + " "}
                <Tooltip title="Explore" placement="topLeft">
                  <Button
                    shape="circle"
                    type="primary"
                    size="small"
                    icon={<SearchOutlined />}
                    ghost
                    onClick={() => {
                      let object = inspectData;
                      path.forEach((key) => (object = object[key]));
                      console.log(object);
                      setNewInspectData({ object });
                    }}
                  />
                </Tooltip>
              </>
            );
          }
          {
            return <>{name}</>;
          }
        }}
      />
    </DetailSidebar>
  );

  function goBackInspector() {
    const data = goBackStack.pop();
    if (data !== undefined) {
      inspectData === undefined ? null : goForwardStack.push(inspectData);
      setInspectData(data);
    }
    setGoForwardStack(goForwardStack);
    setGoBackStack(goBackStack);
    console.log("goForwardStack");

    console.log(goForwardStack);
    console.log("goBackStack");

    console.log(goBackStack);
  }

  function goForwardInspector() {
    const data = goForwardStack.pop();
    if (data !== undefined) {
      inspectData === undefined ? null : goBackStack.push(inspectData);
      setInspectData(data);
    }
    setGoForwardStack(goForwardStack);
    setGoBackStack(goBackStack);
    console.log("goForwardStack");

    console.log(goForwardStack);
    console.log("goBackStack");

    console.log(goBackStack);
  }
};
