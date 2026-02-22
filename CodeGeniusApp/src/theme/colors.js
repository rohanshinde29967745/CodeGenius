// Premium Light Theme - Warm, Inviting, Professional
const lightColors = {
    // Primary Brand Colors - Rich Indigo/Purple (Premium feel)
    primary: '#6366f1',              // Indigo - Premium tech look
    primaryDark: '#4f46e5',          // Darker indigo
    primaryLight: '#a5b4fc',         // Light indigo
    primaryGradientStart: '#818cf8',
    primaryGradientEnd: '#6366f1',

    // Backgrounds - Clean, Warm Whites
    background: '#fafbfc',           // Warm off-white (not cold gray)
    backgroundSecondary: '#f4f6f8',  // Slightly warmer
    backgroundCard: '#ffffff',       // Pure white cards

    // Text Colors - Rich, Readable
    text: '#1a1f36',                 // Rich dark blue-black (not pure black)
    textSecondary: '#5e6c84',        // Warm gray-blue
    textMuted: '#97a0af',            // Soft gray

    // Borders - Subtle & Clean
    border: '#ebecf0',               // Soft border
    borderLight: '#f4f5f7',          // Very subtle

    // Inputs - Clean
    inputBackground: '#fafbfc',      // Slight tint
    inputBorder: '#dfe1e6',          // Visible but soft

    // Status Colors - VIBRANT & Eye-catching
    success: '#36b37e',              // Rich green (Atlassian style)
    successLight: '#e3fcef',
    warning: '#ff991f',              // Warm orange (eye-catching)
    warningLight: '#fff4e5',
    error: '#de350b',                // Bold red
    errorLight: '#ffebe5',
    info: '#0065ff',                 // Bright blue
    infoLight: '#deebff',

    // Accent Colors - Make it POP!
    accentCoral: '#ff5630',          // Coral red (like GreenPulse)
    accentOrange: '#ff991f',         // Warm orange
    accentTeal: '#00b8d9',           // Bright teal
    accentPurple: '#6554c0',         // Rich purple
    accentGreen: '#36b37e',          // Fresh green

    // Shadows - Subtle depth
    shadow: 'rgba(9, 30, 66, 0.08)',
    shadowMedium: 'rgba(9, 30, 66, 0.15)',

    // Badge backgrounds - Colorful
    badgeBackground: '#f4f5f7',
    badgePurple: '#eae6ff',          // Light purple
    badgeGreen: '#e3fcef',           // Light green
    badgeOrange: '#fff4e5',          // Light orange
    badgeBlue: '#deebff',            // Light blue
};

// Dark Theme - Keep existing
const darkColors = {
    primary: '#8b5cf6',
    primaryDark: '#7c3aed',
    primaryLight: '#a78bfa',
    primaryGradientStart: '#8b5cf6',
    primaryGradientEnd: '#6366f1',

    background: '#0f172a',
    backgroundSecondary: '#1e293b',
    backgroundCard: '#1e293b',

    text: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',

    border: '#334155',
    borderLight: '#475569',

    inputBackground: '#0f172a',
    inputBorder: '#475569',

    success: '#22c55e',
    successLight: '#166534',
    warning: '#f59e0b',
    warningLight: '#92400e',
    error: '#ef4444',
    errorLight: '#991b1b',
    info: '#3b82f6',
    infoLight: '#1e40af',

    accentCoral: '#fb923c',
    accentTeal: '#2dd4bf',

    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowMedium: 'rgba(0, 0, 0, 0.5)',

    badgeBackground: '#1e293b',
    badgePurple: '#3730a3',
    badgeGreen: '#166534',
    badgeOrange: '#9a3412',
};

// Default export for backward compatibility
export const colors = darkColors;

// Export themes for Context
export const themes = {
    light: lightColors,
    dark: darkColors,
};

export const fonts = {
    regular: 'System',
    bold: 'System',
    sizes: {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 20,
        xxl: 24,
        xxxl: 32,
    },
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};
