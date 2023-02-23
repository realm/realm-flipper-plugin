import { ClearOutlined } from '@ant-design/icons';
import { Button, Col, Layout, Modal, Row, Select, Tag } from 'antd';
import { usePlugin, useValue } from 'flipper-plugin';
import React, { useState } from 'react';
import { plugin } from '../../..';
import { renderValue } from '../../../utils/Renderer';
import { getDefault, TypeInput, TypeInputProps } from './TypeInput';

export const MixedInput = ({
  set,
  defaultValue,
  isPrimary,
}: TypeInputProps) => {
  const [reset, setReset] = useState(0);
  const [chosen, setChosen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [chosenType, setChosenType] = useState('string');

  const [value, setValue] = useState<unknown | undefined>(
    defaultValue === null ? undefined : defaultValue
  );
  const { state, downloadData } = usePlugin(plugin);
  const { schemas } = useValue(state);

  const addObject = () => {
    set(value);
    // setChosenType()
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
    setChosenType('string');
    setReset((v) => v + 1);
    hideModal();
  };

  const onChangeSelect = (newType: string) => {
    setChosenType(newType);

    const typeObj = {
      type: newType,
      optional: false,
    };
    const defaultValue = getDefault(typeObj);
    setValue(defaultValue);
  };

  const renderChosen = () => {
    const objectType = schemas.find((schema) => schema.name === chosenType);
    let type;
    if (objectType) {
      type = 'object';
    } else {
      type = chosenType;
    }
    return (
      <Row align="middle">
        <Col flex="auto">
          <Tag color="success">{chosenType}</Tag>
          {renderValue(value, { type, objectType: objectType?.name }, schemas, {downloadData})}
        </Col>
        <Col>
          <Button
            disabled={isPrimary}
            icon={<ClearOutlined />}
            onClick={() => {
              set(null);
              setChosen(false);
              setValue(null);
            }}
          ></Button>
        </Col>
      </Row>
    );
  };

  const renderSelector = () => {
    const typeList = [
      // 'objectId',
      // 'uuid',
      'bool',
      'int',
      'float',
      'double',
      // 'decimal128',
      'string',
      // 'data',
      // 'date',
    ].reverse();

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
          title={'Set mixed'}
          visible={visible}
          onOk={addObject}
          onCancel={cancelWindow}
          okText="Create"
          cancelText="Cancel"
        >
          <Layout>
            <div>Select a type:</div>
            <Select
              defaultValue={'string'}
              onChange={onChangeSelect}
              key={reset}
            >
              <Select.OptGroup label="Primitive types">
                {typeList.map((item, index) => {
                  return (
                    <Select.Option value={item} key={index}>
                      {item}
                    </Select.Option>
                  );
                })}
              </Select.OptGroup>
              {/* This is for supporting linkedObjects as mixed values, which is not supported yet:
              <Select.OptGroup label="Link types">
                {schemas.map((item, index) => {
                  return (
                    <Select.Option
                      key={typeList.length + index}
                      value={item.name}
                    >
                      {item.name}
                    </Select.Option>
                  );
                })}
              </Select.OptGroup> */}
            </Select>
            <TypeInput
              isPrimary={isPrimary}
              property={{
                type: chosenType,
                optional: false,
              }}
              set={(val: any) => {
                setValue(val);
              }}
              defaultValue={value}
              extraProps={{ style: { width: '100%' } }}
            ></TypeInput>
          </Layout>
        </Modal>
      </Layout>
    );
  };

  return chosen ? renderChosen() : renderSelector();
};
