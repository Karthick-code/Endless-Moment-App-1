import { jsx as _jsx } from "react/jsx-runtime";
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

// Native Android status bar: show Android time, battery, and network indicators.
if (Capacitor.isNativePlatform()) {
  StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
  StatusBar.setBackgroundColor({ color: '#0c0d10' }).catch(() => {});
  StatusBar.setStyle({ style: Style.Light }).catch(() => {});
}
createRoot(document.getElementById('root')).render(_jsx(App, {}));
