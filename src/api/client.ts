import axios from 'axios';
import axiosTauriApiAdapter from 'axios-tauri-api-adapter';
const client = axios.create({
  adapter: axiosTauriApiAdapter,
  baseURL: 'https://api.pathofexile.com/',
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('oauth_token');
  config.headers['Authorization'] = 'Bearer ' + token;
  config.headers['User-Agent'] =
    'OAuth loothound/0.1 (contact: paul.kosel@rub.de) StrictMode';

  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log(error);
    if (error.response.status === 401) {
      localStorage.removeItem('oauth_token');
      window.location.href = '/';
    }
    return error;
  }
);

export default client;
