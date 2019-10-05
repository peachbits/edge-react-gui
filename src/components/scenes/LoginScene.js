// @flow

import type { EdgeAccount, EdgeContext } from 'edge-core-js'
import { LoginScreen } from 'edge-login-ui-rn'
import React, { Component } from 'react'
import { Keyboard, StatusBar, StyleSheet, View } from 'react-native'
import slowlog from 'react-native-slowlog'

import ENV from '../../../env.json'
import edgeBackgroundImage from '../../assets/images/edgeBackground/login_bg.jpg'
import edgeLogo from '../../assets/images/edgeLogo/Edge_logo_L.png'
import s from '../../locales/strings.js'
import THEME from '../../theme/variables/airbitz.js'
import type { Dispatch } from '../../types/reduxTypes.js'
import { showHelpModal } from '../modals/HelpModal.js'
import { showError } from '../services/AirshipInstance.js'

type Props = {
  initializeAccount: (EdgeAccount, touchIdInfo: ?Object) => void,
  context: EdgeContext,
  addUsernames: (Array<string>) => void,
  account: ?EdgeAccount,
  recoveryLogin: string,
  dispatch: Dispatch,
  username?: string
}
type State = { key: number }

let firstRun = true

export default class Login extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = { key: 0 }
    slowlog(this, /.*/, global.slowlogOptions)
  }

  componentDidMount () {
    const { YOLO_USERNAME, YOLO_PASSWORD } = ENV
    if (YOLO_USERNAME != null && YOLO_PASSWORD != null && firstRun) {
      const { context, initializeAccount } = this.props
      firstRun = false
      setTimeout(() => {
        context
          .loginWithPassword(YOLO_USERNAME, YOLO_PASSWORD)
          .then(account => initializeAccount(account))
          .catch(showError)
      }, 500)
    }
  }

  onLogin = (error: ?Error = null, account: ?EdgeAccount, touchIdInfo: ?Object = null) => {
    if (error || !account) return
    this.props.initializeAccount(account, touchIdInfo)

    // update users list after each login
    this.props.context.listUsernames().then(usernames => {
      this.props.addUsernames(usernames)
    })
  }

  UNSAFE_componentWillReceiveProps (nextProps: Props) {
    // If we have logged out, destroy and recreate the login screen:
    if (this.props.account && nextProps.account && nextProps.account !== this.props.account) {
      if (typeof nextProps.account.username === 'undefined') {
        this.setState({ key: this.state.key + 1 })
      }
    }
  }

  onClickHelp () {
    Keyboard.dismiss()
    showHelpModal()
  }

  render () {
    return !this.props.context.listUsernames ? null : (
      <View style={styles.container} testID={'edge: login-scene'}>
        <LoginScreen
          username={this.props.username}
          accountOptions={null}
          context={this.props.context}
          recoveryLogin={this.props.recoveryLogin}
          onLogin={this.onLogin}
          fontDescription={{
            regularFontFamily: THEME.FONTS.DEFAULT
          }}
          key={this.state.key.toString()}
          appName={s.strings.app_name_short}
          backgroundImage={edgeBackgroundImage}
          primaryLogo={edgeLogo}
          parentButton={{ text: s.strings.string_help, callback: this.onClickHelp }}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    paddingTop: StatusBar.currentHeight,
    backgroundColor: THEME.COLORS.PRIMARY
  }
})
