import {
  AsyncStorage,
} from 'react-native';
export function saveSession(session) {
  return AsyncStorage
    .getItem('sessions')
    .then(sessions => {
      let list;
      try {
        list = JSON.parse(sessions || '[]');
      } catch(x) {
        list = [];
      }

      AsyncStorage
        .setItem('sessions', JSON.stringify(
          list.concat(session)
        ));
    })
}
export function saveMetric(key, value) {
  return AsyncStorage
    .getItem('session-' + key)
    .then(session => {
      let list;
      try {
        list = JSON.parse(session || '[]');
      } catch(x) {
        list = [];
      }

      AsyncStorage
        .setItem('session-' + key, JSON.stringify(
          list.concat(value)
        ));
    });
}

export function loadSessions() {
  return new Promise((resolve) => {
    AsyncStorage.getItem('sessions')
      .then(sessions => {
        resolve(JSON.parse(sessions || '[]'));
      });
  });
}

export function loadMeasurements(key) {
  return new Promise(resolve => {
    AsyncStorage.getItem('session-' + key)
      .then(sessions => {
        resolve(JSON.parse(sessions || '[]'));
      });
  });
}
