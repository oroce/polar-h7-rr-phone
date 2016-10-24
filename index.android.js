/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */
const debug = require('react-native-debug')('polarh7');
require('debug').enable('*');
import { Buffer } from 'buffer';
import React, { Component } from 'react';
import {
  AppRegistry,
  //StyleSheet,
  Text,
  View,
  TouchableHighlight,
  NativeAppEventEmitter
} from 'react-native';
import BleManager from 'react-native-ble-manager';
//import Speech from 'react-native-speech';
/*export default class PolarH7RR extends Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          Welcome to React Native!
        </Text>
        <Text style={styles.instructions}>
          To get started, edit index.android.js
        </Text>
        <Text style={styles.instructions}>
          Double tap R on your keyboard to reload,{'\n'}
          Shake or press menu button for dev menu
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});*/

export default class PolarH7RR extends Component {

    constructor(){
        super()

        this.state = {
            ble:null,
            scanning:false,
            devices: []
        }
    }

    componentDidMount() {
        BleManager.start({showAlert: false});
        this.handleDiscoverPeripheral = this.handleDiscoverPeripheral.bind(this);

        NativeAppEventEmitter
            .addListener('BleManagerDiscoverPeripheral', this.handleDiscoverPeripheral );
        NativeAppEventEmitter
            .addListener('BleManagerDidUpdateValueForCharacteristic', this.handleCharacteristicNotification)
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
    }

    toggleScanning(bool){
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
          console.log('connecting to %s', data.id);
          this.setState({status: 'connecting to polar'})
          BleManager.connect(data.id)
            .then(info => {
              this.setState({status: 'connected to polar'});
              console.log('polarinfo', info);

              BleManager.startNotification(data.id, '0000180d-0000-1000-8000-00805f9b34fb', '00002a37-0000-1000-8000-00805f9b34fb')
                .then(() => this.setState({
                  status: 'we are listening',
                  deviceConnected: data.id
                }))
                .catch(err => console.error(err));
            })
            .catch((error) => {
              // Failure code
              console.log(error);
            });

        }

    }

    render() {

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
        return (
            <View style={container}>
                <TouchableHighlight style={{padding:20, backgroundColor:'#ccc'}} onPress={() => this.toggleScanning(!this.state.scanning) }>
                    <Text>Scan Bluetooth ({this.state.scanning ? 'on' : 'off'})</Text>
                </TouchableHighlight>

                {bleList}
                { status }
                { listEl }
            </View>
        );
    }
}

AppRegistry.registerComponent('PolarH7RR', () => PolarH7RR);
