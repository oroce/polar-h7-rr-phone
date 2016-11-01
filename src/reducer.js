import { createReducer } from 'redux-action';
import {
  startScanning,
  stopScanning,
  deviceFound
} from './actions';
import initialState from './initial-state';
function type(action) {
  return action.type;
}
//console.log('polar acti', Object.keys(actions.startScanning.type));
export default createReducer(initialState, {
  [type(startScanning)]: (payload, state) => {
    return {
      ...state,
      isScanning: true
    };
  },
  [type(stopScanning)]: (payload, state) => {
    return {
      ...state,
      isScanning: false
    };
  },
  [type(deviceFound)]: (payload, state) => {
    return {
      ...state,
      isDeviceFound: true
    };
  },
});
