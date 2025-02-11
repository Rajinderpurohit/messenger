// ApiService.js
import { API_URL } from './constants';
// This function sends API requests and returns the response
const sendRequest = async ({ url=API_URL, method = 'GET', headers = {}, body = null }) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers, // You can pass additional headers like Authorization, etc.
      },
      body: body ? JSON.stringify(body) : null,
    };
  
    try {
      const response = await fetch(url, options);
  
      // Check if the response is successful (status code 200-299)
      if (!response.ok) {
        throw new Error(`Request failed with status: ${response.status}`);
      }
  
      const data = await response.json();
      return data; // Return the data from the response
  
    } catch (error) {
      // Log and return the error if the request fails
      console.error('API request error:', error);
      return { error: error.message };
    }
  };
  
  export default sendRequest;  