import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://dontquitprogram.onrender.com/api', 
  withCredentials: true 
});

// 👇 EL PATOVICA DEL FRONTEND: Agarra el token del cajón y se lo da a Axios
instance.interceptors.request.use(
  (config) => {
    // Buscamos el token tal cual lo guardás en tu AuthContext
    const token = localStorage.getItem('token'); 
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;