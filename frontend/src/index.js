/*import React from 'react';
import ReactDOM from 'react-dom';
import './index.css'; 
import App from './App';
import {BrowserRouter} from 'react-router-dom';

ReactDOM.render(
  <BrowserRouter>
  <React.StrictMode>
    <App />
  </React.StrictMode>
 </BrowserRouter>,
  document.getElementById('root')
);*/
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

