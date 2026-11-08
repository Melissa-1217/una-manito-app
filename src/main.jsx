import SkipLink from './components/SkipLink.jsx';
import PwaControls from './components/PwaControls.jsx';
import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/plus-jakarta-sans';
import AuthFlow from './components/AuthFlow.jsx';
import './styles.css';
import './auth.css';
import './components/manolito.css';
import './accessibility.css';
import './pwa.css';
import './experience.css';
import './feed.css';

createRoot(document.getElementById('root')).render(<React.StrictMode><SkipLink/><PwaControls/><AuthFlow /></React.StrictMode>);
