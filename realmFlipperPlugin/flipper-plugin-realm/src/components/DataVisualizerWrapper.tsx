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
  sortDirection: 'ascend' | 'descend' | null;
  sortingColumn: string | null;
};

export const DataVisualizerWrapper = ({
  schemas,
  objects,
  currentSchema,
  sortDirection,
  sortingColumn,
}: InputType) => {
  return (
    <>
      <SchemaSelect schemas={schemas} />
      <Layout.Container height={800}>
        <DataTabHeader currentSchema={currentSchema} />
        <DataVisualizer
          objects={objects}
          schemas={schemas}
          currentSchema={currentSchema}
          sortDirection={sortDirection}
          sortingColumn={sortingColumn}
        />
      </Layout.Container>
    </>
  );
};
