import React, {useMemo} from 'react';

import {Task} from './models/Task';
import {TaskRealmContext} from './models';
import {TaskManager} from './components/TaskManager';
import RealmPlugin from 'realm-flipper-plugin-device';

const {useQuery, useRealm} = TaskRealmContext;

export const AppNonSync = () => {
  const result = useQuery(Task);
  const realm = useRealm();

  const tasks = useMemo(() => result.sorted('createdAt'), [result]);

  return (
    <>
      <RealmPlugin realms={[realm]} />
      <TaskManager tasks={tasks} />
    </>
  );
};
