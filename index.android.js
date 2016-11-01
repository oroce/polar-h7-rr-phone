/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */
if (!__DEV__) {
 //require('./raven');
}
const debugFactory = require('react-native-debug');
const debug = debugFactory('polarh7');
debugFactory.enable('*');

import React, { Component } from 'react';
import {
  AsyncStorage,
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  NativeAppEventEmitter,
  ToolbarAndroid,
  Navigator,
  NativeModules
} from 'react-native';
import Record from './src/containers/record';
import History from './history';
import styles from './styles';
import Notification from 'react-native-system-notification';

import {
  COLOR,
  ThemeProvider,
} from 'react-native-material-ui';
import { Provider } from 'react-redux';
import store from './src/store';
import * as actions from './src/actions';
const UIManager = NativeModules.UIManager;

const uiTheme = {
    palette: {
        primaryColor: COLOR.green500,
    },
    toolbar: {
        container: {
            height: 50,
        },
    },
};

var RouteMapper = function(route, navigationOperations, onComponentRef, props) {
  _navigator = navigationOperations;
  console.log('polar route is ', route, props);
  if (route.name === 'record') {
    return (
      <Record navigator={navigationOperations} { ...props } />
    );
  } else if (route.name === 'history') {
      return (
        <History navigator={navigationOperations} />
      );
    // return (
    //   <View style={{flex: 1}}>
    //     <ToolbarAndroid
    //       actions={[]}
    //       navIcon={require('image!android_back_white')}
    //       onIconClicked={navigationOperations.pop}
    //       style={styles.toolbar}
    //       titleColor="white"
    //       title={route.movie.title} />
    //     <MovieScreen
    //       style={{flex: 1}}
    //       navigator={navigationOperations}
    //       movie={route.movie}
    //     />
    //   </View>
    // );
  }
};

export default class PolarH7RR extends Component {
  constructor(){
    super()
  }
  componentWillMount() {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }

  componentDidMount() {
    console.log('polar: componentDidMount', this.worker);

    store.dispatch(actions.connectWorker());

  }
  notifyWorker(action, payload) {
    console.log('polar notifying worker', action, payload);
    if (!this.worker) {
      console.error('polar: no worker attached');
      return;
    }
    const msg = {
      action,
      payload
    };
    this.worker.postMessage(JSON.stringify(msg));
  }
  render() {
    var initialRoute = {
      name: 'record',
      onStart: () => this.notifyWorker('start')
    };
    return (
      <Provider store={ store }>
        <ThemeProvider uiTheme={uiTheme}>
          <Navigator
            style={styles.container}
            initialRoute={initialRoute}
            configureScene={() => Navigator.SceneConfigs.FadeAndroid}
            renderScene={ (route, navigationOperations, onComponentRef) => RouteMapper(route, navigationOperations, onComponentRef, this.props)}
          />
        </ThemeProvider>
      </Provider>
    );
  }
}

AppRegistry.registerComponent('PolarH7RR', () => PolarH7RR);
