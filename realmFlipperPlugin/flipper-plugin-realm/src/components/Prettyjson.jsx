import React from "react";
import { Layout, styled } from "flipper-plugin";

export default function Prettyjson(props) {
  //console.log(JSON.stringify(props.json, undefined, 4));

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
