import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/plus-jakarta-sans';
import AuthFlow from './components/AuthFlow.jsx';
import './styles.css';
import './auth.css';

createRoot(document.getElementById('root')).render(<React.StrictMode><AuthFlow /></React.StrictMode>);
