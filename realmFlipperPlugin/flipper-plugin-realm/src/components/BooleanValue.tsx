import { Typography } from 'antd';
import { styled, theme } from 'flipper-plugin';
const { Text } = Typography;

const NonWrappingText = styled(Text)({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const BooleanValue = styled(NonWrappingText)<{ active?: boolean }>(
  (props) => ({
    '&::before': {
      content: '""',
      display: 'inline-block',
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: props.active ? theme.successColor : theme.errorColor,
      marginRight: 5,
      marginTop: 1,
    },
  })
);