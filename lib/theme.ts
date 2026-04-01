'use client';

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
    },
    typography: {
        fontFamily: 'inherit', // Using Next.js font or Tailwind font
    },
    components: {
        // We can add global overrides here if needed
    },
});

export default theme;
