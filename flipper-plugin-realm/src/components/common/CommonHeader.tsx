import { Toolbar } from 'flipper-plugin';
import React from 'react';
import { RealmSelect } from './RealmSelect';
import ViewModeTabs from './ViewModeTabs';

type InputType = {
  viewMode: 'data' | 'schemas' | 'RQL' | 'schemaGraph';
  setViewMode: React.Dispatch<
    React.SetStateAction<'data' | 'schemas' | 'schemaGraph'>
  >;
  realms: string[];
};

export const CommonHeader = ({ viewMode, setViewMode, realms }: InputType) => {
  return (
    <Toolbar position="top" right={<RealmSelect realms={realms} />}>
      <ViewModeTabs viewMode={viewMode} setViewMode={setViewMode} />
    </Toolbar>
  );
};
