import {useMemo} from 'react';
import React from 'react';
import {Task} from '../models/Task';
import {TaskManager} from '../components/TaskManager';
import {PluginTestRealmContext} from './Schemas';
const {useQuery} = PluginTestRealmContext;

export default function TaskManagerWithPlugin() {
  const result = useQuery(Task);

  const tasks = useMemo(() => result.sorted('createdAt'), [result]);

  return (
    <>
      <TaskManager tasks={tasks} />
    </>
  );
}
