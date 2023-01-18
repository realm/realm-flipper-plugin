import { Col, Form, Row, Tag } from 'antd';
import React from 'react';
import { TypeInput } from './types/TypeInput';

type ProperyRenderProps = {
  initialValue: unknown;
  property: Realm.CanonicalObjectSchemaProperty;
  isPrimary: boolean;
  set: (value: unknown) => void;
};

export const typeToString = (property: Realm.CanonicalObjectSchemaProperty): string => {
  let title = '';

  switch (property.type) {
    case 'list':
    case 'set':
    case 'dictionary':
    case 'object':
      title += property.objectType;
      break;
    default:
      title += property.type;
  }

  if (property.optional) {
    title += '?';
  }

  switch (property.type) {
    case 'list':
      title += '[]';
      break;
    case 'set':
      title += '<>';
      break;
    case 'dictionary':
      title += '{}';
      break;
  }

  return title;
};

export const PropertyRender = ({
  initialValue,
  property,
  isPrimary,
  set,
}: ProperyRenderProps) => {
  const title = typeToString(property);

  return (
    <>
      <Row gutter={[0, 16]}>
        <Col>{property.name}</Col>
        <Col flex="auto">
          {/* <Divider type="horizontal" style={{width: '100%'}}></Divider> */}
        </Col>
        <Col>
          <Tag color="default">{title}</Tag>
          {!property.optional ? <Tag color="blue">required</Tag> : null}
          {isPrimary ? <Tag color="green">primary key</Tag> : null}
          {/* </span> */}
        </Col>
        <Col span={24}>
          <Form >
            <TypeInput
              isPrimary={isPrimary}
              property={property}
              set={set}
              defaultValue={initialValue}
              extraProps={{ style: { width: '100%' } }}
            />
          </Form>
        </Col>
      </Row>
    </>
    // </Layout.Container>
  );
};
