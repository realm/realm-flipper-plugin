import { Layout } from 'flipper-plugin';
import React from 'react';
import { SchemaObject, RealmObject } from '../CommonTypes';
import DataVisualizer from '../pages/DataVisualizer';

import { DataTabHeader } from './DataTabHeader';
import SchemaSelect from './SchemaSelect';

type InputType = {
  schemas: SchemaObject[];
  objects: RealmObject[];
  currentSchema: SchemaObject;
  sortingDirection: 'ascend' | 'descend' | null;
  sortingColumn: string | null;
};

export const DataVisualizerWrapper = ({
  schemas,
  objects,
  currentSchema,
  sortingDirection,
  sortingColumn,
}: InputType) => {
  return (
    <>
      <SchemaSelect schemas={schemas} />
      <Layout.Container style={{height: "100%"}}>
        <DataTabHeader currentSchema={currentSchema} />
        <DataVisualizer
          objects={objects}
          schemas={schemas}
          currentSchema={currentSchema}
          sortingDirection={sortingDirection}
          sortingColumn={sortingColumn}
        />
      </Layout.Container>
    </>
  );
};
