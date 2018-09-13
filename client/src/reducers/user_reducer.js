import { LOGIN_USER } from '../actions/types'

// function return state
export default function(state={}, action) {
    switch (action.type) {
        case LOGIN_USER:
            return {...state, loginSuccess: action.payload}
        default:
            return state;
    }
}