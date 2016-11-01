import React, { Component } from 'react';
import { saveSession, saveMetric } from '../../utils';
import { Buffer } from 'buffer';
const debug = require('react-native-debug')('polar-h7-rr:record');
import {
  AsyncStorage,
  AppRegistry,
  Text,
  View,
  TouchableHighlight,
  NativeAppEventEmitter,
  ToolbarAndroid,
  StyleSheet
} from 'react-native';
import BleManager from 'react-native-ble-manager';
import uuid from 'react-native-uuid';
import Notification from 'react-native-system-notification';
import {
  Button,
  Toolbar,
} from 'react-native-material-ui';
import Container from 'react-native-material-ui/src/Container';
const styles = StyleSheet.create({
    rowContainer: {
        flexDirection: 'row',
        alignItems:'center',
        justifyContent:'center',
        flex: 1
    },
    button: {
        marginHorizontal: 8,
    },
});

export default class PolarRecorder extends Component {
  constructor(){
      super()

      this.state = {
          ble:null,
          scanning:false,
          devices: [],
          measurements: [],
          sessionId: ''
      };
  }
  getInitialProps() {
    return {
      isScanning: false,
      isDeviceFound: false
    };
  }

  componentDidMount() {
      BleManager.start({showAlert: false});
      this.handleDiscoverPeripheral = this.handleDiscoverPeripheral.bind(this);

      NativeAppEventEmitter
          .addListener('BleManagerDiscoverPeripheral', this.handleDiscoverPeripheral );
      NativeAppEventEmitter
          .addListener('BleManagerDidUpdateValueForCharacteristic', (args) => this.handleCharacteristicNotification(args))
  }

  handleActionSelected(pos) {
    console.log('polar', pos);
    this.props.navigator.push({
      name: 'history'
    });
  }
  handleScan() {
    console.log('start scanning');
    if (this.state.deviceConnected) {
      return;
    }
    BleManager.scan([], 30, true)
        .then((results) => console.log('Scanning...'));
  }

  handleCharacteristicNotification(args) {
    const {
      peripheral,
      characteristic,
      value
    } = args;

    console.log('we received %s, %s, %s', peripheral, characteristic, value);
    var val = new Buffer(value, 'hex');
    const rate = val.readUInt8(1);
    const n = (val.length - 2) / 2;
    console.log('polar rate', rate);
    if (n === 0) {
      return;
    }
    const rr = +(val.readUInt16LE(2).toFixed(4));
    console.log('polar rr=', rr);
    if (this.state.notificationId) {
      Notification.create({
        id: this.state.notificationId,
        bigText: `HR: ${rate} | RR: ${rr}`,
        ongoing: true
      });
    }
    this.setState({
      measurements: this.state.measurements.concat({
        time: Date.now(),
        rr: rr,
        rate: rate
      })
    }, () => {
      saveMetric(this.state.sessionId, this.state.measurements);
    });
  }
  handleDump() {
    AsyncStorage.getItem('sessions')
      .then(sessions => {
        let list;
        console.log('polar sessions are', sessions)
        try {
          list = JSON.parse(sessions || '[]');
        } catch(x) {
          console.error('polar error', x, sessions);
          list = [];
        }
        list.forEach(el => {
          AsyncStorage.getItem('session-' + el)
            .then(result => {
              console.log('polar result of %s is %s', el, result);
            });
        });
      });
  }
  toggleScanning(bool){
    this.props.onStart();
    //this.worker.send(JSON.stringify({action: 'start'}));
      return;
      if (bool) {
          this.setState({scanning:true})
          this.scanning = setInterval( ()=> this.handleScan(), 3000);
      } else{
          this.setState({scanning:false, ble: null})
          clearInterval(this.scanning);
      }
  }

  handleDiscoverPeripheral(data){
      debug('Got ble data: %j', data);
      this.setState({
        devices: this.state.devices.concat(data),
        ble: data
      });
      const { name = ''} = data;
      if (name.startsWith('Polar H7')) {
        if (this.state.notificationId) {
          Notification.delete(this.state.notificationId);
        }
        Notification.create({
          id: 1337,
          subject: 'Polar HRV',
          message: 'Found device',
          smallIcon: 'ic_launcher',
          autoClear: false,
          ongoing: true
          //payload: { number: 1, what: true, someAnswer: '42' }
        });
        console.log('connecting to %s', data.id);
        this.setState({
          status: 'connecting to polar',
          notificationId: 1337,
          scanning: 'off'
        });
        BleManager.connect(data.id)
          .then(info => {
            const sessionId = uuid.v4();
            Notification.create({
              id: this.state.notificationId,
              message: 'Device connected',
              ongoing: true
            });
            this.setState({
              status: 'connected to polar',
              sessionId: sessionId
            }, () => {;
              saveSession(sessionId);
              console.log('polarinfo', info);

              BleManager.startNotification(data.id, '0000180d-0000-1000-8000-00805f9b34fb', '00002a37-0000-1000-8000-00805f9b34fb')
                .then(() => {
                  Notification.create({
                    id: this.state.notificationId,
                    message: 'Receiving data',
                    ongoing: true
                  });
                  this.setState({
                    status: 'we are listening',
                    deviceConnected: data.id
                  });
                })
                .catch(err => console.error(err));
            });
          })
          .catch((error) => {
            // Failure code
            console.log(error);
          });

      }

  }
  handleStop() {
    if (this.state.notificationId) {
      Notification.delete(this.state.notificationId);
    }
    BleManager
      .stopNotification(this.state.ble.id, '0000180d-0000-1000-8000-00805f9b34fb', '00002a37-0000-1000-8000-00805f9b34fb')
        .then(() => {
          BleManager.disconnect(this.state.ble.id)
            .then(() => console.log('polar disconnected'))
            .catch((err) => console.log('polar error' + err + err.stack));
            this.setState({
              ble: null,
              notificationId: null
            });
          });
  }
  handleConnect() {
    this.props.onStart();
  }
  render() {
    console.log('polar record render', Object.keys(this.props));
      const container = {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F5FCFF',
      }
      const devices = this.state.devices;
      const bleList = this.state.ble
          ? <Text> Device found: {this.state.ble.name} </Text>
          : <Text>no devices nearby</Text>
      const status = (
        <Text>{ this.state.status }</Text>
      );
      let listEl;
      if (devices.length === 0) {
        listEl = (
          <Text>No device yet</Text>
        );
      } else {
        listEl = devices
          .map((device, i) => {
            return (
              <Text key={ i }>{device.name}</Text>
            );
          });
      }
      let stop;
      if (this.state.ble && this.state.ble.id) {
        stop = (
          <TouchableHighlight onPress={ () => this.handleStop() } style={{padding:20, marginTop: 20, backgroundColor:'#ccc'}}>
            <Text>Stop</Text>
          </TouchableHighlight>
        );
      }
      // <ToolbarAndroid
      //   title="PolarH7RR"
      //   actions={ [{ title: 'History', show: 'always'}] }
      //   onActionSelected={(pos) => this.handleActionSelected(pos)}
      //   style={styles.toolbar}
      // />
      const rightEl = (
        <Button text="History" style={ { 'text': { color: 'white'}}}/>
      );
      let buttonProps = {
        text: 'Connect'
      }
      if (this.props.isScanning) {
        buttonProps = {
          disabled: true,
          text: 'Scanning'
        };
      } else if (this.props.isDeviceFound) {
        buttonProps = {
          disabled: true,
          text: 'Device found'
        };
      }
      return (
        <Container>
          <Toolbar
            rightElement={ rightEl }
            onRightElementPress={ () => this.handleActionSelected() }
          />
          <View style={styles.rowContainer}>
            <Button
              primary
              raised
              { ...buttonProps }
              onPress={ () => this.handleConnect() }
              style={ {container: {height: 80} }}
            />
          </View>
        </Container>
      );

        /*  </Container>
          <View style={container}>
            <TouchableHighlight style={{padding:20, backgroundColor:'#ccc'}} onPress={() => this.toggleScanning(!this.state.scanning) }>
                <Text>Scan Bluetooth ({this.state.scanning ? 'on' : 'off'})</Text>
            </TouchableHighlight>
            <TouchableHighlight style={{padding:20, marginTop: 20, backgroundColor:'#ccc'}} onPress={ this.handleDump }>
              <Text>Dump</Text>
            </TouchableHighlight>

            <TouchableHighlight style={{padding:20, marginTop: 20, backgroundColor:'#ccc'}} onPress={ () => AsyncStorage.clear() }>
              <Text>clear</Text>
            </TouchableHighlight>
            {bleList}
            { status }
            { listEl }
            { stop }
            <Button raised text="yolo" />
          </View>
        </Container>
      );*/
  }
}
