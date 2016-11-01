import React, { Component } from 'react';
import { loadSessions, loadMeasurements } from './utils';
import {
  Text,
  View,
  TouchableHighlight,
  ToolbarAndroid,
  ListView,
  TouchableOpacity
} from 'react-native';
import styles from './styles';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
export default class PolarRecorder extends Component {
  constructor(){
    super()
    this.state = {
      sessions: [],
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => row1 !== row2,
      })
    };
  }

  componentDidMount() {
    loadSessions()
      .then(sessions => {
        this.setState({
          dataSource: this.state.dataSource.cloneWithRows(sessions),
          sessions: sessions
        });
      });
  }

  handleActionSelected(pos) {
    console.log('polar', pos);
    // this.props.navigator.push({
    //   title: 'history'
    // });
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
  handleOpen(row) {
    console.log('polar open');
    const tmp = RNFS.TemporaryDirectoryPath || RNFS.ExternalDirectoryPath;
    const path = tmp + '/' + row + '.csv';
    loadMeasurements(row)
      .then(data => {
        console.log('polar data loaded');
        console.log('polar writing file to %s', path)
        const content = data
        .sort((a, b) => a.time - b.time)
        .map((item, i, arr) => {
          const first = arr[0].time;
          const diff = item.time - first;
          if (diff === 0) {
            return;
          }
          return [
            diff / 1000,
            item.rr
          ].join('\t');
        })
        .filter(item => item != null)
        .join('\r\n');

        console.log('polar content:\n' + content);
        RNFS.writeFile(
          path,
          content,
          'ascii'
        ).then(() => {
          console.log('polar file written');
          let shareOptions = {
            // title: "React Native",
            // message: "Hola mundo",
            url: `file://${path}`,
            type: 'text/plain',
            //subject: "Share Link" //  for email
          };
          Share.open(shareOptions);
        });
      });

  }

  renderRow(row) {
    return (
      <TouchableOpacity onPress={ () => this.handleOpen(row) }>
        <View>
          <Text>{ row }</Text>
        </View>
      </TouchableOpacity>
    );
  }

  render() {
    return (
      <View style={ styles.container }>

        <ToolbarAndroid
          title="PolarH7RR"
          actions={ [{ title: 'Back', show: 'always'}] }
          onActionSelected={(pos) => this.handleActionSelected(pos)}
          style={styles.toolbar}
        />
        <ListView
          dataSource={this.state.dataSource}
          renderRow={ (row) => this.renderRow(row) }
        />
      </View>
    );
  }
}
