/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic':
                    'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
            },
            colors: {
                popover: {
                    DEFAULT: 'hsl(0 0% 100%)', // Blanco sólido
                    foreground: 'hsl(222.2 84% 4.9%)', // Gris oscuro sólido
                },
                accent: {
                    DEFAULT: 'hsl(210 40% 96%)', // Gris muy claro sólido
                    foreground: 'hsl(222.2 84% 4.9%)', // Gris oscuro sólido
                },
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-in-from-bottom-4': 'slideInFromBottom 0.3s ease-out',
                'slide-in-from-bottom-6': 'slideInFromBottom 0.5s ease-out',
                'slide-in-from-left': 'slideInFromLeft 0.3s ease-out',
                'bounce-subtle': 'bounceSubtle 0.6s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideInFromBottom: {
                    '0%': { transform: 'translateY(100%)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideInFromLeft: {
                    '0%': { transform: 'translateX(-20px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                bounceSubtle: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-5px)' },
                },
            },
            boxShadow: {
                '3xl': '0 35px 60px -12px rgba(0, 0, 0, 0.25)',
            },
        },
    },
    plugins: [],
}
