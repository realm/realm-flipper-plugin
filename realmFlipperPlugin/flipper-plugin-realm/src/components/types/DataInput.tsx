import { UploadOutlined } from "@ant-design/icons";
import { Button, Col, DatePicker, Input, InputNumber, Layout, Row, Upload } from "antd";
import { UploadChangeParam, UploadFile } from "antd/lib/upload";
import React, { useState } from "react";
import { TypeInputProps } from "./TypeInput";

export const DataInput = ({ property, value, set, style }: TypeInputProps) => {
  const [reset, setReset] = useState(0);
  const emptyState: {
    selectedFile?: UploadFile<any>;
    selectedFileList: UploadFile<any>[];
  } = {
    selectedFileList: [],
  };
  const [state, setState] = useState(emptyState);

  const chooseFile = (file: UploadFile<any>) => {
    set(file);
  };

  const onChange = (info: UploadChangeParam<UploadFile<any>>) => {
    const nextState = emptyState;
    switch (info.file.status) {
      case "uploading":
        nextState.selectedFileList = [info.file];
        break;
      case "done":
        chooseFile(info.file);
        nextState.selectedFile = info.file;
        nextState.selectedFileList = [info.file];
        break;

      default:
        // error or removed
        nextState.selectedFile = undefined;
        nextState.selectedFileList = [];
    }
    setState(nextState);
    setReset(v => v + 1)
  };

  return (
    <Layout style={{ backgroundColor: 'white' }}>
      <Upload
        fileList={state.selectedFileList}
        customRequest={(options) => options.onSuccess?.("ok")}
        onChange={onChange}
        // style={{ backgroundColor: 'white' }}
      >
        <Button><UploadOutlined/>Select a file</Button>
      </Upload>
    </Layout>
  );
};
