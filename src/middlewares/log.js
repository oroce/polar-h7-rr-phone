export default store => next => action => {
  console.log('polar mw:', action.type);
  return next(action);
};
