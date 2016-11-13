import storage from 'electron-json-storage'
import { toastr } from 'redux-toastr'
import _ from 'lodash'
import cuid from 'cuid'
import { arrayMove } from 'react-sortable-hoc'
import { actions as interactiveActions } from './Interactive'
import { actions as boardActions } from './Board'
import analytics from '../utils/analytics'
import { Howl, Howler } from 'howler'
Howler.usingWebAudio = true
Howler.ctx = true
// Constants
export const constants = {
  SOUNDS_INITIALIZE: 'SOUNDS_INITIALIZE',
  LOAD_SOUNDS: 'LOAD_SOUNDS',
  ADD_SOUNDS: 'ADD_SOUNDS',
  REMOVE_SOUND: 'REMOVE_SOUND',
  EDIT_SOUND: 'EDIT_SOUND',
  CLEAR_ALL_SOUNDS: 'CLEAR_ALL_SOUNDS',
  SORT_SOUNDS: 'SORT_SOUNDS',
  PLAY_SOUND_STARTED: 'PLAY_SOUND_STARTED',
  PLAY_SOUND_ENDED: 'PLAY_SOUND_ENDED',
  PLAY_SOUND_INTERRUPTED: 'PLAY_SOUND_INTERRUPTED',
  PLAY_SOUND_ERROR: 'PLAY_SOUND_ERROR',
  CLEAR_EDIT: 'CLEAR_EDIT',
  SETUP_EDIT: 'SETUP_EDIT'
}

const syncStorageWithState = (state) => {
  storage.set('sounds', state, (err) => {
    if (err) throw err
  })
}

// Action Creators
export const actions = {
  initialize: (data) => {
    return {
      type: constants.SOUNDS_INITIALIZE,
      payload: { loadedState: data }
    }
  },
  addSounds: (files) => {
    return (dispatch, getState) => {
      const state = getState()
      let sounds = Object.assign([], state.sounds.sounds)
      files.map((file) => {
        if (!_.find(sounds, (sound) => { return sound.path === file.path })) {
          let splitName = file.name.split('.')
          let name = ''
          if (splitName.length > 1) {
            delete splitName[splitName.length - 1]
            let tempName = splitName.join('.')
            name = tempName.substring(0, tempName.length - 1)
          } else if (splitName.length === 1) {
            name = splitName[0]
          } else {
            name = file.name
          }
          sounds.push({ id: cuid(), name: name, path: file.path, cooldown: state.sounds.default_cooldown,
            sparks: state.sounds.default_sparks, volume: state.sounds.default_volume })
        } else {
          toastr.warning('Duplicate Detected',
            file.path + ' already exists in your library.')
        }
      })
      dispatch({
        type: constants.ADD_SOUNDS,
        payload: { sounds: sounds }
      })
      analytics.updateSoundCount(state.sounds.sounds.length, 1)
    }
  },
  sortSounds: (oldIndex, newIndex) => {
    return (dispatch, getState) => {
      const { sounds: { sounds } } = getState()
      const sortedSounds = arrayMove(sounds, oldIndex, newIndex)
      dispatch({
        type: constants.SORT_SOUNDS,
        payload: { sounds: sortedSounds }
      })
    }
  },
  removeSound: (index) => {
    return (dispatch, getState) => {
      const { sounds: { sounds } } = getState()
      const newSounds = Object.assign([], sounds)
      const removedSound = newSounds.splice(index, 1)
      toastr.success(removedSound[0].name + ' Removed!')
      dispatch({
        type: constants.REMOVE_SOUND,
        payload: { sounds: newSounds }
      })
      analytics.updateSoundCount(sounds.length, -1)
    }
  },
  editSound: (id, cooldown, sparks, name, volume) => {
    return (dispatch, getState) => {
      const { sounds: { sounds } } = getState()
      const newSounds = Object.assign([], sounds)
      newSounds.map((sound) => {
        if (sound.id === id) {
          sound.cooldown = cooldown
          sound.sparks = sparks
          sound.name = name
          sound.volume = volume
        }
      })
      toastr.success('Sound Updated!')
      dispatch({
        type: constants.EDIT_SOUND,
        payload: { sounds: newSounds }
      })
      dispatch(interactiveActions.updateCooldown())
      dispatch(boardActions.updateGame())
    }
  },
  clearAllSounds: () => {
    return {
      type: constants.CLEAR_ALL_SOUNDS
    }
  },
  playSound: (i) => {
    return (dispatch, getState) => {
      const { profiles: { profileId, profiles }, sounds: { sounds }, app: { selectedOutput } } = getState()
      try {
        const profile = _.find(profiles, p => p.id === profileId)
        const soundId = profile.sounds[i]
        const sound = _.find(sounds, s => s.id === soundId)
        const howl = new Howl({
          urls: [sound.path],
          buffer: true,
          volume: parseFloat(sound.volume) * 0.01,
          onend: () => {
            dispatch({ type: constants.PLAY_SOUND_ENDED })
          }
        })
        if (selectedOutput) howl._audioNode[0].setSinkId(selectedOutput)
        howl.play()
        analytics.soundPlayed()
        dispatch({ type: constants.PLAY_SOUND_STARTED })
      } catch (err) {
        dispatch({ type: constants.PLAY_SOUND_ERROR })
      }
    }
  },
  clearEdit: () => {
    return {
      type: constants.CLEAR_EDIT
    }
  },
  setupEdit: (index) => {
    return (dispatch, getState) => {
      const { profiles: { profiles, profileId } } = getState()
      const profile = _.find(profiles, p => p.id === profileId)
      let sound = profile.sounds[index]
      dispatch({
        type: constants.SETUP_EDIT,
        payload: sound
      })
    }
  }
}
// Action handlers
const ACTION_HANDLERS = {
  SOUNDS_INITIALIZE: (state, actions) => {
    const { payload: { loadedState } } = actions
    return {
      ...state,
      ...loadedState
    }
  },
  ADD_SOUNDS: (state, actions) => {
    const { payload: { sounds } } = actions
    return {
      ...state,
      sounds: sounds
    }
  },
  SORT_SOUNDS: (state, actions) => {
    const { payload: { sounds } } = actions
    return {
      ...state,
      sounds: sounds
    }
  },
  REMOVE_SOUND: (state, actions) => {
    const { payload: { sounds } } = actions
    return {
      ...state,
      sounds: sounds
    }
  },
  EDIT_SOUND: (state, actions) => {
    const { payload: { sounds } } = actions
    return {
      ...state,
      sounds: sounds
    }
  },
  CLEAR_ALL_SOUNDS: (state) => {
    return {
      ...state,
      sounds: []
    }
  },
  CLEAR_EDIT: (state) => {
    return {
      ...state,
      hasEdit: null
    }
  },
  SETUP_EDIT: (state, actions) => {
    const { payload } = actions
    return {
      ...state,
      hasEdit: payload
    }
  }
}
// Reducer
export const initialState = {
  sounds: [],
  default_cooldown: 15,
  default_sparks: 100,
  default_volume: 100,
  hasEdit: null
}
export default function (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]
  let newState
  if (handler) {
    newState = handler(state, action)
    syncStorageWithState(newState)
  } else {
    newState = state
  }
  return newState
}
