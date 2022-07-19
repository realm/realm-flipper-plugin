import React from "react";
import { Layout, styled } from "flipper-plugin";

type Property = {
  json: Array<Object>;
};

export default function Prettyjson(props: Property) {
  return (
    <Container>
      <pre>{JSON.stringify(props.json, null, 2)}</pre>
    </Container>
  );
}

const Container = styled(Layout.Container)({
  fontFamily: "Courier New",
  color: "green",
});
