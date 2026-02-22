import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const AnimatedBorder = ({ children, style }) => {
    const { theme, isDark } = useTheme();
    const opacityAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        if (!isDark) return; // Disable animation in light mode if preferred, or keep it subtle

        Animated.loop(
            Animated.sequence([
                Animated.timing(opacityAnim, {
                    toValue: 0.8,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0.3,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [isDark]);

    if (!isDark) {
        return (
            <View style={[styles.container, { borderColor: theme.border }, style]}>
                {children}
            </View>
        );
    }

    return (
        <View style={[styles.container, style]}>
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        borderColor: theme.primary,
                        borderWidth: 1,
                        borderRadius: style?.borderRadius || 16,
                        opacity: opacityAnim,
                    },
                ]}
            />
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        borderWidth: 1,
        borderColor: 'transparent', // Base border
    },
});

export default AnimatedBorder;
