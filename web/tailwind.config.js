/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // --- Sunlit Warm Commercial Tokens (Dominan Putih & Kuning Cerah — Anti-Slop) ---
        'bg-main': '#FAF8F5',
        'surface-card': '#FFFFFF',

        canvas: '#FAF8F5', // latar utama Warm Alabaster (Putih Gading lembut)
        app: '#FAF8F5', // latar aplikasi mobile cerah
        surface: '#FFFFFF', // kartu utama Pure Crisp White
        nested: '#F4F2EC', // input, kontrol & area sekunder Warm Stone
        'nested-hover': '#EAE6DC',
        elevated: '#FFFBEB', // sorotan kuning gading lembut (Amber-50)
        line: '#E5E2DA', // garis rambut 1px bersih di atas putih
        'line-strong': '#D1CCC0',
        'line-warm': '#FDE047',
        ink: {
          1: '#18181B', // teks utama Charcoal tajam (kontras > 14:1)
          2: '#3F3F46', // teks sekunder Slate
          3: '#686873', // meta / helper (kontras >= 5:1 di atas putih)
          4: '#9CA3AF', // dekoratif / disabled
        },
        brand: {
          yellow: '#FACC15',
          amber: '#F59E0B',
          deep: '#B45309',
          cream: '#FEF9C3',
        },
        shopee: { DEFAULT: '#EE4D2D', ink: '#C23315', deep: '#D2411D' },
        wa: { DEFAULT: '#16A34A', deep: '#15803D' },
        // Palet disamakan dengan APK final: burnt-orange / brown, bukan kuning cerah.
        yellow: {
          50: '#FFFBEB', 100: '#FEF3C7', 200: '#FDE68A', 300: '#D97706',
          400: '#B45309', 500: '#92400E', 600: '#78350F', 700: '#651F0B',
          800: '#451A03', 900: '#2C1002',
        },
        amber: {
          50: '#FFFBEB', 100: '#FEF3C7', 200: '#FDE68A', 300: '#D97706',
          400: '#B45309', 500: '#92400E', 600: '#78350F', 700: '#651F0B',
          800: '#451A03', 900: '#2C1002',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        '3xs': ['0.625rem', { lineHeight: '0.875rem' }], // 10px - penghitung badge
        '2xs': ['0.6875rem', { lineHeight: '1rem' }], // 11px - meta & badge mikro
        body: ['0.8125rem', { lineHeight: '1.25rem' }], // 13px - teks sekunder
      },
      opacity: {
        3: '0.03',
        4: '0.04',
        6: '0.06',
        7: '0.07',
        8: '0.08',
        12: '0.12',
        14: '0.14',
        16: '0.16',
        18: '0.18',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(24, 24, 27, 0.04), 0 8px 24px -12px rgba(24, 24, 27, 0.07)',
        pop: '0 16px 36px -12px rgba(24, 24, 27, 0.14)',
        gold: '0 4px 14px -2px rgba(245, 158, 11, 0.28)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'pop-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'dot-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.5' },
          '80%, 100%': { transform: 'scale(2)', opacity: '0' },
        },
        sweep: {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 180ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-up': 'fade-up 260ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-in-right': 'slide-in-right 260ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'pop-in': 'pop-in 200ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'dot-ring': 'dot-ring 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        sweep: 'sweep 1.6s cubic-bezier(0.22, 1, 0.36, 1) infinite',
      },
    },
  },
  plugins: [],
};
