import type { SVGProps } from 'react';

/**
 * Conjunto mínimo de ícones desenhados à mão (traço 1.6, cantos arredondados).
 * Evita uma dependência inteira de biblioteca de ícones por meia dúzia de formas.
 */
type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="20"
      height="20"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconDashboard = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3" y="3" width="7.5" height="8.5" rx="2" />
    <rect x="13.5" y="3" width="7.5" height="5" rx="2" />
    <rect x="13.5" y="10.5" width="7.5" height="10.5" rx="2" />
    <rect x="3" y="14" width="7.5" height="7" rx="2" />
  </Icon>
);

export const IconIngredients = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 3h12l-1 4.2a3 3 0 0 1-.9 1.6L14 11v9a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-9L7.9 8.8A3 3 0 0 1 7 7.2Z" />
    <path d="M6.6 6.5h10.8" />
  </Icon>
);

export const IconRecipe = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H18a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6.5A1.5 1.5 0 0 1 5 18.5Z" />
    <path d="M5 17.5h13.5" />
    <path d="M9 7.5h6M9 11h4" />
  </Icon>
);

export const IconPrice = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3v18" />
    <path d="M16.5 7.2C15.7 6 14 5.2 12.2 5.2c-2.3 0-4 1.2-4 3s1.5 2.6 4 3.2c2.7.6 4.4 1.4 4.4 3.4 0 2-1.9 3.3-4.4 3.3-2 0-3.8-.8-4.7-2.1" />
  </Icon>
);

export const IconHistory = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.7-6.2" />
    <path d="M3.5 4.5V9H8" />
    <path d="M12 7.8V12l3 1.8" />
  </Icon>
);

export const IconReports = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 20h16" />
    <rect x="5" y="11" width="3.5" height="6" rx="1" />
    <rect x="10.25" y="7" width="3.5" height="10" rx="1" />
    <rect x="15.5" y="13" width="3.5" height="4" rx="1" />
  </Icon>
);

export const IconSettings = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.8v2.1M12 19.1v2.1M21.2 12h-2.1M4.9 12H2.8M18.5 5.5 17 7M7 17l-1.5 1.5M18.5 18.5 17 17M7 7 5.5 5.5" />
  </Icon>
);

export const IconPlus = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const IconArrowRight = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);

export const IconCheck = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />
  </Icon>
);

export const IconTrash = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 6.5h16M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7" />
    <path d="M6.5 6.5 7.4 19a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-12.5" />
  </Icon>
);

export const IconEdit = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 20h4l10.3-10.3a2.1 2.1 0 0 0 0-3l-1-1a2.1 2.1 0 0 0-3 0L4 16Z" />
    <path d="M13.5 6.5 17.5 10.5" />
  </Icon>
);

export const IconCopy = (props: IconProps) => (
  <Icon {...props}>
    <rect x="9" y="9" width="11" height="11" rx="2.2" />
    <path d="M15 6.5V5.6A1.6 1.6 0 0 0 13.4 4H5.6A1.6 1.6 0 0 0 4 5.6v7.8A1.6 1.6 0 0 0 5.6 15h.9" />
  </Icon>
);

export const IconAlert = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5M12 16h.01" />
  </Icon>
);

export const IconMenu = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
);

export const IconClose = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 6 18 18M18 6 6 18" />
  </Icon>
);

export const IconLogout = (props: IconProps) => (
  <Icon {...props}>
    <path d="M14.5 16.5v2A1.5 1.5 0 0 1 13 20H6a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 6 4h7a1.5 1.5 0 0 1 1.5 1.5v2" />
    <path d="M10 12h10M17 8.5l3.5 3.5L17 15.5" />
  </Icon>
);
