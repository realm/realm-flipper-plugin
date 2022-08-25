import { Typography } from 'antd';
import React from 'react';
import { styled, theme } from 'flipper-plugin';
const { Text } = Typography;

// Warning: Received `true` for a non-boolean attribute `active`.
// ^ happens here

const NonWrappingText = styled(Text)({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const BooleanValue = (props: { active?: boolean; value: string }) => {
  return (
    <>
      <NonWrappingText
        style={{
          content: '""',
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: props.active ? theme.successColor : theme.errorColor,
          marginRight: 7,
          marginTop: 1,
        }}
      ></NonWrappingText>
      <span>{props.value}</span>
    </>
  );
};

export default BooleanValue;