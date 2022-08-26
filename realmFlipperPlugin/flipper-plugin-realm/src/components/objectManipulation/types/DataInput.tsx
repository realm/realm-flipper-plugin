import { UploadOutlined } from "@ant-design/icons";
import { Button, Col, message, Upload } from 'antd';
import { UploadChangeParam, UploadFile, RcFile } from "antd/lib/upload";
import React, { useState } from "react";
import { TypeInputProps } from "./TypeInput";

export const DataInput = ({ set, isPrimary }: TypeInputProps) => {
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
      const typedArray = new Uint8Array(contents);
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

  const beforeUpload = (file: RcFile) => {
    const size = file.size;
    const goodSize = size < 60 * 1024 * 1024;
    if (!goodSize) {
      message.error("File must be smaller than 60MB!");
    }
    return goodSize;
  }

  return (
    <Col span={24}>
      <Upload
        beforeUpload={beforeUpload}
        fileList={state.selectedFileList}
        customRequest={(options) => options.onSuccess?.('ok')}
        onChange={onChange}
        disabled={isPrimary}
      >
        <Button>
          <UploadOutlined />
          Select a file
        </Button>
      </Upload>
    </Col>
  );
};
