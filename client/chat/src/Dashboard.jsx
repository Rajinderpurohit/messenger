import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Chat from './components/Chat';
import sendRequest from './ApiService';
import { API_URL } from './constants';

function Dashboard() {
  const [username, setUsername] = useState('');
  const [isLoading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const token = localStorage.getItem('token');
  
  useEffect(() => {
    const checkLoginStatus = async () => {
       // Retrieve token here to get the latest value
      if (token) {
        try {
          const res = await sendRequest({
            url: `${API_URL}/validateToken`,
            method: 'POST',
            headers: { Authorization: token },
          });

          if (res && res.length > 0 && res[0].id && res[0].username) { // Add response structure check
            localStorage.setItem("user_id", res[0].id);
            setUsername(res[0].username);
            setIsLoggedIn(true);
          } else {
            console.error('Unexpected response format', res);
            setIsLoggedIn(false);
          }
        } catch (err) {
          console.error('Error during login:', err);
          setIsLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
      }
      setLoading(false);
    };

    checkLoginStatus();
  }, []); // Removed token from dependency array to avoid unnecessary re-renders

  if (isLoading) {
    return <div className="loader">Loading...</div>;
  }

  return isLoggedIn ? <Chat username={username} token={ token }/> : <Login />;
}

export default Dashboard;