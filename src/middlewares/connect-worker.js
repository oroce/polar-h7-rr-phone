import { connectWorker } from '../actions';
import { Worker } from 'react-native-workers';
import { isFSA } from 'flux-standard-action';
let worker;
export default store => next => action => {
  const {
    type,
    meta = {},
    payload
  } = action;
  if (type !== connectWorker.type && !meta.worker) {
    return next(action);
  }

  if (type === connectWorker.type) {
    console.log('polar cw', payload);
    worker = new Worker('./src/worker.js');
    worker.onmessage = (data) => {
      let msg;
      try {
        msg = JSON.parse(data);
      } catch (x) {
        console.log('polar unknown data: ', x, data);
        return;
      }
      if (!isFSA(msg)) {
        console.log('polar not sfa', msg);
        return;
      }
      store.dispatch(msg);
    };
  }

  worker.postMessage(JSON.stringify(action));

  return next(action);
};
