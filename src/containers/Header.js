import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { actions as authActions } from '../redux/modules/Authentication'
import { actions as appActions } from '../redux/modules/App'
import { shell } from 'electron'
const WIN32 = process.platform === 'win32'

export class Header extends React.Component {

  static propTypes = {
    username: PropTypes.string,
    avatarUrl: PropTypes.string,
    isAuthenticated: PropTypes.bool.isRequired,
    authActions: PropTypes.object.isRequired,
    appActions: PropTypes.object.isRequired,
    hasUpdate: PropTypes.bool.isRequired
  }

  minimize = () => {
    this.props.appActions.minimize()
  }

  maximize = () => {
    this.props.appActions.maximize()
  }

  close = () => {
    this.props.appActions.close()
  }

  updateApp = () => {
    if (WIN32) this.props.appActions.update()
    else shell.openExternal('https://github.com/DeekyJay/SoundwaveInteractive-releases/releases/latest')
  }

  logout = () => {
    this.props.authActions.logout()
  }

  render () {
    const {
      isAuthenticated, username, avatarUrl, hasUpdate
    } = this.props
    return (
      <div className='header-container'>
        <div className='logo'></div>
        <div className='dead-zone'></div>
        {hasUpdate
          ? <div className='update-container' onClick={this.updateApp}>
            <span className='sicon-update'></span>
          </div>
          : null}
        {isAuthenticated
          ? <div className='user-container'>
            <div className='user-image-container'>
              <span className='sicon-user'></span>
              <img src={avatarUrl || ''} />
            </div>
            <div className='user-text'>
              <div className='user-name'>Hi, {username || 'User'}</div>
              <div className='user-logout' onClick={this.logout}>Logout</div>
            </div>
          </div>
          : null}
        <div className='window-actions'>
          <div className='action minimize' onClick={this.minimize}>
            <span className='sicon-dash'></span>
          </div>
          <div className='action maximize' onClick={this.maximize}>
            <span className='sicon-max'></span>
          </div>
          <div className='action exit' onClick={this.close}>
            <span className='sicon-cross'></span>
          </div>
        </div>
      </div>
    )
  }
}

/* istanbul ignore next */
const mapStateToProps = (state) => ({
  username: state.auth.user.username,
  avatarUrl: state.auth.user.avatarUrl,
  isAuthenticated: state.auth.isAuthenticated,
  hasUpdate: state.app.hasUpdate
})

/* istanbul ignore next */
const mapDispatchToProps = (dispatch) => ({
  authActions: bindActionCreators(authActions, dispatch),
  appActions: bindActionCreators(appActions, dispatch)
})

export default connect(mapStateToProps, mapDispatchToProps)(Header)
