import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://dontquitprogram.onrender.com/api', 
  withCredentials: true 
});

export default instance;