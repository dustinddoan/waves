import axios from 'axios';
import { LOGIN_USER } from './types' 
import { USER_SERVER } from '../components/utils/misc'


export const loginUser = (dataToSubmit) => {
    const request = axios.post(`${USER_SERVER}/login`, dataToSubmit)
        .then(res => res.data)
    
        return {
            type: LOGIN_USER,
            payload: request
        }
}