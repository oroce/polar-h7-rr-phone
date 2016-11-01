if (!__DEV__) {
  //require('./raven');
}
import { self } from 'react-native-workers';
const debugFactory = require('debug');
const debug = debugFactory('polar-h7-rr:worker');
debugFactory.enable('*');
import BleManager from 'react-native-ble-manager';
import {
  NativeAppEventEmitter
} from 'react-native';
import { Buffer } from 'buffer';
import Notification from 'react-native-system-notification';
import RNFS from 'react-native-fs';
import uuid from 'react-native-uuid';
import {
  startScanning,
  stopScanning,
  deviceFound
} from './actions';

let currentId;
/* get message from application. String only ! */
debug('yaay');
function type(action) {
  return action.type;
}
self.onmessage = (message) => {
  console.log('polar msg arrived: ' + message);
  let msg;
  try {
    msg = JSON.parse(message);
  } catch (err) {
    console.log('polar err' + err.stack);
    return;
  }
  switch(msg.type) {
    case type(startScanning):
      start();
      break;
    default:
      console.log('polar dunno about:' + msg.action);
      break;
  }
}
function dispatch(action) {
  action((result) => {
    const str = JSON.stringify(result);
    console.log('polar sending back to main', str, result);
    self.postMessage(str);
  }, () => ({}));
}

function start() {
  console.log('polar start scanning');
  BleManager
    .getConnectedPeripherals()
    .then(peripherals => {
      console.log('polar connected', peripherals);
      scan();
    });

}

function scan() {
  console.log('polar scan');
  BleManager.scan([], 30, true)
  setTimeout( ()=> scan(), 3000);
}
function connect(id) {
  dispatch(deviceFound(id));
  return;
  BleManager.connect(id)
    .then(info => {
        currentId = uuid.v4();
        BleManager.startNotification(id, '0000180d-0000-1000-8000-00805f9b34fb', '00002a37-0000-1000-8000-00805f9b34fb');
    });
}
NativeAppEventEmitter
    .addListener('BleManagerDiscoverPeripheral', (data) => {
      const { name = ''} = data;
      console.log('polar new item', data);
      if (name.startsWith('Polar H7')) {
        BleManager.stopScan();
        dispatch(stopScanning());
        connect(data.id)
      }
    });
NativeAppEventEmitter
    .addListener('BleManagerDidUpdateValueForCharacteristic', (args) => {
      const {
        peripheral,
        characteristic,
        value
      } = args;
      const at = Date.now();
      console.log('polar we received %s, %s, %s', peripheral, characteristic, value);
      var val = new Buffer(value, 'hex');
      const rate = val.readUInt8(1);
      const n = (val.length - 2) / 2;
      console.log('polar rate', rate);
      if (n === 0) {
        return;
      }
      const rr = +(val.readUInt16LE(2).toFixed(4));
      console.log('polar rr=', rr);
      Notification.create({
        id: 1337,
        bigText: `HR: ${rate} | RR: ${rr}`,
        ongoing: true,
        onlyAlertOnce: true
      });
      const tmp = RNFS.TemporaryDirectoryPath || RNFS.ExternalDirectoryPath;
      const path = tmp + '/' + currentId + '.json';
      console.log('polar append to file:', path);
      RNFS
        .appendFile(
          path,
          new Buffer(
            JSON.stringify({
              rr: rr,
              hr: rate,
              at: at
            }) + '\n'
          ).toString('base64'),
          'base64'
        );
    });
