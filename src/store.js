import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import log from './middlewares/log';
import connectWorker from './middlewares/connect-worker';
import reducer from './reducer';
import initialState from './initial-state';
const middleware = applyMiddleware(thunk, log, connectWorker);
export default createStore(reducer, initialState, middleware);
