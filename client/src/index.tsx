import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { ConnectionProvider } from './store/connection';
import { WalletProvider } from './store/wallet';

ReactDOM.render(
  <React.StrictMode>
    <ConnectionProvider>
      <WalletProvider>
        <App />
      </WalletProvider>
    </ConnectionProvider>
  </React.StrictMode>,
  document.getElementById('root')
);


