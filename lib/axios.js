import Axios from 'axios';
import { Platform } from 'react-native';

const baseURL = Platform.select({
  web: 'https://localhost:7123',
  default: 'https://gemtimes-hddkabegcge5ckdc.centralus-01.azurewebsites.net', // Fallback
});

// Create an Axios instance
const axios = Axios.create({
  baseURL: `${baseURL}/api`, // Your API endpoint
  headers: {
    'Content-Type': 'application/json', // Ensure proper content type
    'X-Requested-With': 'XMLHttpRequest', // This header is sometimes required for AJAX requests
  },
  // withCredentials: true // This ensures that cookies (if any) are included in the request
});

// Optional: Add interceptors if you need to log requests or handle responses globally
axios.interceptors.response.use(
  response => response, // Pass response as is for success
  error => {
    if (error.response) {
      // Handle error response here, e.g., unauthorized errors
      if (error.response.status === 401) {
        // Handle unauthorized errors (maybe redirect to login)
      }
    }
    return Promise.reject(error); // Reject the promise so that it can be handled in the component
  }
);

export default axios;
