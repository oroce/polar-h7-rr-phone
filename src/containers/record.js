import { connect } from 'react-redux';
import Record from '../components/record';
import * as actions from '../actions';
function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return {
    onStart: () => dispatch(actions.startScanning())
  };
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Record);
