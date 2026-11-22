import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App.jsx';
import OAuthConsent from '@/pages/OAuthConsent';
import '@/index.css';

// The app has no router package: the MCP consent page the platform links to is
// mounted by path, outside any auth guard (it handles the signed-out case
// itself). Everything else renders the app.
const path = window.location.pathname.replace(/\/+$/, "") || "/";
const Root = path === "/oauth/consent" ? OAuthConsent : App;

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);