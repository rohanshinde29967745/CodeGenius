import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const RegisterScreen = ({ navigation }) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { register } = useAuth();
    const { theme } = useTheme();

    const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

    const handleRegister = async () => {
        setError('');
        setSuccess('');

        if (!fullName.trim()) {
            setError('Please enter your name.');
            return;
        }
        if (!validateEmail(email)) {
            setError('Please enter a valid email.');
            return;
        }
        if (!password || password.length < 4) {
            setError('Password must be at least 4 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        const result = await register({ fullName: fullName.trim(), email, password });
        setLoading(false);

        if (result.success) {
            setSuccess('Account created successfully! Redirecting to login...');
            setTimeout(() => navigation.navigate('Login'), 1500);
        } else {
            setError(result.error || 'Registration failed. Please try again.');
        }
    };

    const handleSocialSignup = (provider) => {
        Alert.alert('Social Signup', `${provider} signup is available in the web version. Use email/password for mobile app.`);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[styles.card, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
                            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Join CodeGenius today</Text>
                        </View>

                        {/* Error Message */}
                        {error ? (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        {/* Success Message */}
                        {success ? (
                            <View style={styles.successBox}>
                                <Text style={styles.successText}>{success}</Text>
                            </View>
                        ) : null}

                        {/* Full Name Input */}
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="John Doe"
                            placeholderTextColor="#9ca3af"
                            value={fullName}
                            onChangeText={setFullName}
                            autoCapitalize="words"
                        />

                        {/* Email Input */}
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="you@company.com"
                            placeholderTextColor="#9ca3af"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                        />

                        {/* Password Input */}
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
                        <View style={styles.passwordRow}>
                            <TextInput
                                style={[styles.input, styles.passwordInput]}
                                placeholder="••••••••"
                                placeholderTextColor="#9ca3af"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity
                                style={styles.showButton}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Text style={styles.showButtonText}>
                                    {showPassword ? 'Hide' : 'Show'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Confirm Password Input */}
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Confirm Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor="#9ca3af"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showPassword}
                        />

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#f8fafc" />
                            ) : (
                                <Text style={styles.submitButtonText}>Create Account</Text>
                            )}
                        </TouchableOpacity>

                        {/* Social Signup */}
                        <View style={styles.orContainer}>
                            <View style={[styles.orLine, { backgroundColor: theme.border }]} />
                            <Text style={[styles.orText, { color: theme.textMuted }]}>or sign up with</Text>
                            <View style={[styles.orLine, { backgroundColor: theme.border }]} />
                        </View>

                        <View style={styles.socialRow}>
                            <TouchableOpacity
                                style={[styles.socialButton, styles.googleButton]}
                                onPress={() => handleSocialSignup('Google')}
                            >
                                <Text style={styles.socialIconDark}>G</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.socialButton, styles.githubButton]}
                                onPress={() => handleSocialSignup('GitHub')}
                            >
                                <Text style={styles.socialIconLight}>🐙</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.socialButton, styles.facebookButton]}
                                onPress={() => handleSocialSignup('Facebook')}
                            >
                                <Text style={styles.socialIconLight}>f</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={[styles.footerText, { color: theme.textSecondary }]}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.signInText}>Sign in</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: '#1e293b',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: '#334155',
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#94a3b8',
    },
    errorBox: {
        backgroundColor: '#ef444420',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#ef4444',
    },
    errorText: {
        fontSize: 14,
        color: '#ef4444',
    },
    successBox: {
        backgroundColor: '#22c55e20',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#22c55e',
    },
    successText: {
        fontSize: 14,
        color: '#22c55e',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#94a3b8',
        marginBottom: 8,
        marginTop: 4,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 2,
        borderColor: '#7c3aed',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: '#1e293b',
        marginBottom: 12,
    },
    passwordRow: {
        position: 'relative',
    },
    passwordInput: {
        paddingRight: 70,
    },
    showButton: {
        position: 'absolute',
        right: 14,
        top: 14,
    },
    showButtonText: {
        fontSize: 14,
        color: '#7c3aed',
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: '#7c3aed',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#f8fafc',
    },
    orContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    orLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#334155',
    },
    orText: {
        fontSize: 13,
        color: '#64748b',
        marginHorizontal: 12,
    },
    socialRow: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    socialButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 8,
        borderWidth: 2,
    },
    googleButton: {
        backgroundColor: '#ffffff',
        borderColor: '#ea4335',
    },
    githubButton: {
        backgroundColor: '#24292e',
        borderColor: '#333',
    },
    facebookButton: {
        backgroundColor: '#1877f2',
        borderColor: '#1877f2',
    },
    socialIconDark: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ea4335',
    },
    socialIconLight: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    footerText: {
        fontSize: 14,
        color: '#94a3b8',
    },
    signInText: {
        fontSize: 14,
        color: '#7c3aed',
        fontWeight: '600',
    },
});

export default RegisterScreen;
