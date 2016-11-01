import { createAction } from 'redux-action';

export const startScanning = createAction('start scanning', null, () => {
  return {
    worker: true
  };
});
export const connectWorker = createAction('connect worker');
export const deviceFound = createAction('device found');
export const stopScanning = createAction('stop scanning');
