// svelte.config.js

import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    kit: {
        // ... otras configuraciones
        adapter: adapter({
            // fallback: '404.html' // Opcional: para enrutamiento en el lado del cliente (SPA)
			fallback: '404.html'
        }),
        paths: {
            // Reemplaza 'nombre-de-tu-repositorio' con el nombre real.
            // Si es un sitio de usuario/organización, usa ''
            base: process.argv.includes('dev') ? '' : '/linaje_app',
            relative: false
        }
    }
};

export default config;