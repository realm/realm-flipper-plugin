import { Layout } from 'flipper-plugin';
import React from 'react';
import Mermaid from '../components/Mermaid';

// based on https://github.com/realm/realm-js/blob/master/packages/realm-tools/src/realm-schema.ts

type Relationship = {
  from: string;
  to: string;
};

type InputType = {
  schemas: Realm.ObjectSchema[];
  selectedRealm: string;
};

const calculateMermaid = (schemas: Realm.ObjectSchema[]): string => {
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
      const prop = objectSchema.properties[propertyName] as Realm.CanonicalObjectSchemaProperty;
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
export const SchemaGraph = ({ schemas }: InputType) => {
  const str = calculateMermaid(schemas);

  return (
    <Layout.ScrollContainer style={{ height: '800px' }}>
      <Mermaid key={Math.random() * 10} chart={str} />
    </Layout.ScrollContainer>
  );
};
