import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import App from './App';
import './index.css';
import WebPlayback from './WebPlayback';
import Completed from './Completed';
import Login from './Login';

ReactDOM.render(
    <Router>
      <Routes>
        <Route path='/' element={<App/>} />
        <Route path='/webplayback' element={<WebPlayback/>} />
        <Route path='/completed' element={<Completed/>} />
        <Route path='/login' element={<Login/>} />
      </Routes>
    </Router>,
    document.getElementById('root')
  );