import { UploadOutlined } from "@ant-design/icons";
import { Button, Layout, Upload } from 'antd';
import { UploadChangeParam, UploadFile } from "antd/lib/upload";
import React, { useState } from "react";
import { TypeInputProps } from "./TypeInput";

export const DataInput = ({ set }: TypeInputProps) => {
  const [reset, setReset] = useState(0);

  const emptyState: {
    selectedFile?: UploadFile<unknown>;
    selectedFileList: UploadFile<unknown>[];
  } = {
    selectedFileList: [],
  };
  const [state, setState] = useState(emptyState);

  const chooseFile = (file: UploadFile<unknown>) => {
    const fileObj = file.originFileObj
    if (!fileObj) {
      set(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const contents = e.target?.result as ArrayBuffer;
      const typedArray = new Uint8Array(contents)
      set(Array.from(typedArray));
    }
    reader.readAsArrayBuffer(fileObj);
  };

  const onChange = (info: UploadChangeParam<UploadFile<unknown>>) => {
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
