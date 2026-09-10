import type { Config } from 'tailwindcss';

/**
 * Identidade visual do ControlDolces.
 *
 * A paleta parte de um branco quente (nunca #fff puro, que endurece a tela),
 * um rosa dessaturado como cor de marca e um laranja âmbar como destaque.
 * Os neutros também são quentes, para conversarem com o rosa sem cinza sujo.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FDFBF8',
        rose: {
          50: '#FDF5F6',
          100: '#FAE8EB',
          200: '#F4D0D7',
          300: '#EAADB9',
          400: '#DC8095',
          500: '#C95C77',
          600: '#B24460',
          700: '#94364E',
          800: '#7B3043',
          900: '#682B3B',
        },
        amber: {
          50: '#FEF7ED',
          100: '#FDEBD3',
          200: '#FAD5A6',
          300: '#F6B96F',
          400: '#F19B45',
          500: '#E88024',
          600: '#C9661A',
          700: '#A14F16',
        },
        sand: {
          50: '#FAF8F6',
          100: '#F3EFEB',
          200: '#E7E1DB',
          300: '#D5CCC4',
          400: '#A99E95',
          500: '#7D746C',
          600: '#5E5750',
          700: '#45403A',
          800: '#2E2A26',
          900: '#1C1A17',
        },
        /**
         * Tokens semânticos.
         *
         * As escalas acima são a matéria-prima; estes nomes dizem o PAPEL de cada
         * cor. Componentes usam os semânticos (`bg-surface`, `text-muted`), então
         * um ajuste de marca acontece num lugar só.
         */
        primary: {
          DEFAULT: '#B24460',
          hover: '#94364E',
          soft: '#FAE8EB',
          contrast: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#45403A',
          soft: '#F3EFEB',
          contrast: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#E88024',
          soft: '#FDEBD3',
          contrast: '#FFFFFF',
        },
        background: '#FDFBF8',
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#FAF8F6',
          border: '#E7E1DB',
        },
        content: {
          DEFAULT: '#2E2A26',
          strong: '#1C1A17',
          muted: '#5E5750',
          subtle: '#7D746C',
          inverse: '#FDFBF8',
        },
        success: {
          50: '#F0F7F2',
          100: '#DCEDE1',
          500: '#4B8B5E',
          600: '#3C7049',
          700: '#2F5939',
        },
        danger: {
          50: '#FDF3F2',
          100: '#FBE3E0',
          500: '#C0503F',
          600: '#A34032',
          700: '#83332A',
        },
      },
      fontFamily: {
        // Uma família para tudo. `display` existe como apelido semântico para
        // títulos, apontando para a mesma fonte — o contraste vem do peso.
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        'display-tight': '-0.028em',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(28, 26, 23, 0.04), 0 1px 12px rgba(28, 26, 23, 0.04)',
        lift: '0 4px 12px rgba(28, 26, 23, 0.06), 0 12px 32px rgba(28, 26, 23, 0.06)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'none' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 220ms ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
