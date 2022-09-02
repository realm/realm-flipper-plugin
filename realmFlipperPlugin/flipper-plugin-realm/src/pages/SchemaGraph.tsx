import React, { useState } from 'react';
import { SchemaObject, SchemaProperty } from '../CommonTypes';
import Mermaid from 'react-mermaid2';
import { Layout } from 'flipper-plugin';

// based on https://github.com/realm/realm-js/blob/master/packages/realm-tools/src/realm-schema.ts

type Relationship = {
  from: string;
  to: string;
};

type InputType = {
  schemas: SchemaObject[];
  selectedRealm: string;
};


const calculateMermaid = (schemas: SchemaObject[]): string => {
  console.log('rerender ');
  
  let str = '';
  function writer(line: string) {
    str += line + '\n';
  }

  const collectionTypes = ['list', 'dictionary', 'set'];
  const primitiveTypes = [
    'bool',
    'int',
    'float',
    'double',
    'string',
    'date',
    'objectId',
    'uuid',
    'data',
    'mixed',
    'decimal128',
  ];
  writer('classDiagram');

  const relationships: Array<Relationship> = [];
  schemas.forEach((objectSchema) => {
    const name = objectSchema.name;
    writer(`class ${name} {`);
    Object.keys(objectSchema.properties).forEach((propertyName) => {
      const prop = objectSchema.properties[propertyName] as SchemaProperty;
      if (collectionTypes.includes(prop.type) || prop.type === 'object') {
        const objectType = prop.objectType ?? '__unknown__';
        if (!primitiveTypes.includes(objectType)) {
          relationships.push({ from: name, to: objectType });
        }
        if (prop.type === 'object') {
          writer(`  +${objectType} ${propertyName}`);
        } else {
          writer(`  +${prop.type}~${objectType}~ ${propertyName}`);
        }
      } else {
        writer(`  +${prop.type} ${propertyName}`);
      }
    });
    writer('}');
  });
  relationships.forEach((relationship) => {
    writer(`${relationship.to} <-- ${relationship.from}`);
  });
  return str;
};

// let fd = fs.openSync(args.outputFileName, "w");
export const SchemaGraph = ({ schemas, selectedRealm }: InputType) => {
  const str = calculateMermaid(schemas);

  return (
    <Layout.ScrollContainer style={{ height: '800px' }}>
      <Mermaid chart={str}/>
    </Layout.ScrollContainer>
  );
};


// class Mermaid extends React.Component {
//   constructor(props){
//     super(props)
//     console.log('constructor')
//     mermaid.initialize({
//       startOnLoad: true,
//       theme: 'default',
//       securityLevel: 'loose',
//       themeCSS: `
//           g.classGroup rect {
//             fill: #282a36;
//             stroke: #6272a4;
//           } 
//           g.classGroup text {
//             fill: #f8f8f2;
//           }
//           g.classGroup line {
//             stroke: #f8f8f2;
//             stroke-width: 0.5;
//           }
//           .classLabel .box {
//             stroke: #21222c;
//             stroke-width: 3;
//             fill: #21222c;
//             opacity: 1;
//           }
//           .classLabel .label {
//             fill: #f1fa8c;
//           }
//           .relation {
//             stroke: #ff79c6;
//             stroke-width: 1;
//           }
//           #compositionStart, #compositionEnd {
//             fill: #bd93f9;
//             stroke: #bd93f9;
//             stroke-width: 1;
//           }
//           #aggregationEnd, #aggregationStart {
//             fill: #21222c;
//             stroke: #50fa7b;
//             stroke-width: 1;
//           }
//           #dependencyStart, #dependencyEnd {
//             fill: #00bcd4;
//             stroke: #00bcd4;
//             stroke-width: 1;
//           } 
//           #extensionStart, #extensionEnd {
//             fill: #f8f8f2;
//             stroke: #f8f8f2;
//             stroke-width: 1;
//           }`,
//       fontFamily: 'Fira Code',
//     });
// }

//   componentDidMount() {
//     mermaid.contentLoaded();
//     console.log('componentDidMount')
//     this.setState({
      
//     })
//   }
//   render() {
//     console.log('render()')
//     return <div className="mermaid">{this.props.content}</div>;
//   }
// }
