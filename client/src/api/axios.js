import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://dontquitprogram.onrender.com', 
  withCredentials: true 
});

export default instance;