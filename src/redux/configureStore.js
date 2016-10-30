import { applyMiddleware, compose, createStore } from 'redux'
import thunk from 'redux-thunk'
import rootReducer from './rootReducer'
import { routerMiddleware } from 'react-router-redux'
import promiseMiddleware from 'redux-promise-middleware'
import RavenMiddleware from 'redux-raven-middleware'

/* istanbul ignore next */
export default function configureStore (initialState = {}, history) {
  // Compose final middleware and use devtools in debug environment
  let middleware = applyMiddleware(thunk, promiseMiddleware(), routerMiddleware(history),
  RavenMiddleware('https://9cbd4903ac0f4175bef8d33a7b13b628@sentry.io/109325'))
  if (__DEBUG__) {
    const devTools = window.devToolsExtension
      ? window.devToolsExtension()
      : require('containers/DevTools').default.instrument()
    middleware = compose(middleware, devTools)
  }

  // Create final store and subscribe router in debug env ie. for devtools
  const store = middleware(createStore)(rootReducer, initialState)

  if (module.hot) {
    module.hot.accept('./rootReducer', () => {
      const nextRootReducer = require('./rootReducer').default

      store.replaceReducer(nextRootReducer)
    })
  }
  return store
}
