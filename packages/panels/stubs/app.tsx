import '../css/app.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';

// Inertia v3: @inertiajs/vite plugin handles page resolution automatically.
// Do NOT add a manual `resolve` callback — it conflicts with the plugin's
// component wrapper and causes a blank screen.
createInertiaApp({
    title: title => title ? `${title} — Admin` : 'Admin',

    progress: {
        color: '#7c3aed',
        showSpinner: false,
    },

    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
});
