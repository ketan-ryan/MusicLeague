import React, { useState, useEffect } from 'react';
import WebPlayback from './WebPlayback'
import Login from './Login'
import './App.css';

function App() {
    const [token, setToken] = useState('');

    useEffect(() => {
    async function getToken() {
        const response = await fetch('/auth/token');
        const json = await response.json();
        if(response.status == 401) {
            setToken('');
        } else {
            setToken(json.access_token);
        }

        console.log('token set to ', token)
    }

    getToken();

    }, []);

    return (
    <>
        { (token === '') ? <Login/> : <WebPlayback token={token} /> }
    </>
    );
}


export default App;
