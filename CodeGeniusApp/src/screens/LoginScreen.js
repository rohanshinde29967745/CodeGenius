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
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('User');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const { theme } = useTheme();

    const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

    const handleLogin = async () => {
        setError('');

        if (!validateEmail(email)) {
            setError('Please enter a valid email.');
            return;
        }
        if (!password || password.length < 4) {
            setError('Enter a valid password (min 4 chars).');
            return;
        }

        setLoading(true);
        const result = await login(email, password);
        setLoading(false);

        if (!result.success) {
            setError(result.error || 'Login failed. Please try again.');
        }
    };

    const handleSocialLogin = (provider) => {
        Alert.alert('Social Login', `${provider} login is available in the web version. Use email/password for mobile app.`);
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
                            <Text style={[styles.title, { color: theme.text }]}>Welcome back</Text>
                            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Sign in to continue to CodeGenius</Text>
                        </View>

                        {/* Error Message */}
                        {error ? (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

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

                        {/* Role Selector */}
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Role</Text>
                        <View style={styles.roleSelector}>
                            <TouchableOpacity
                                style={[styles.roleButton, role === 'User' && styles.roleButtonActive]}
                                onPress={() => setRole('User')}
                            >
                                <Text style={[styles.roleButtonText, role === 'User' && styles.roleButtonTextActive]}>
                                    User
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.roleButton, role === 'Admin' && styles.roleButtonActive]}
                                onPress={() => setRole('Admin')}
                            >
                                <Text style={[styles.roleButtonText, role === 'Admin' && styles.roleButtonTextActive]}>
                                    Admin
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Remember Me & Forgot */}
                        <View style={styles.optionsRow}>
                            <View style={styles.rememberRow}>
                                <Switch
                                    value={rememberMe}
                                    onValueChange={setRememberMe}
                                    trackColor={{ false: '#334155', true: '#6366f1' }}
                                    thumbColor="#f8fafc"
                                    style={styles.switch}
                                />
                                <Text style={styles.rememberText}>Remember me</Text>
                            </View>
                            <TouchableOpacity>
                                <Text style={styles.forgotText}>Forgot?</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.buttonDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#f8fafc" />
                            ) : (
                                <Text style={styles.submitButtonText}>Sign in</Text>
                            )}
                        </TouchableOpacity>

                        {/* Social Login */}
                        <View style={styles.orContainer}>
                            <View style={styles.orLine} />
                            <Text style={styles.orText}>or sign in with</Text>
                            <View style={styles.orLine} />
                        </View>

                        <View style={styles.socialRow}>
                            <TouchableOpacity
                                style={[styles.socialButton, styles.googleButton]}
                                onPress={() => handleSocialLogin('Google')}
                            >
                                <Text style={styles.socialIcon}>G</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.socialButton, styles.githubButton]}
                                onPress={() => handleSocialLogin('GitHub')}
                            >
                                <Text style={styles.socialIcon}>🐙</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.socialButton, styles.facebookButton, styles.disabledButton]}
                                disabled={true}
                            >
                                <Text style={styles.socialIcon}>f</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>New here? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                <Text style={styles.createAccountText}>Create an account</Text>
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
    roleSelector: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    roleButton: {
        flex: 1,
        backgroundColor: '#f8fafc',
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        marginRight: 8,
    },
    roleButtonActive: {
        borderColor: '#7c3aed',
        backgroundColor: '#7c3aed20',
    },
    roleButtonText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#64748b',
    },
    roleButtonTextActive: {
        color: '#7c3aed',
        fontWeight: '600',
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    rememberRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    switch: {
        transform: [{ scale: 0.8 }],
        marginRight: 4,
    },
    rememberText: {
        fontSize: 14,
        color: '#94a3b8',
    },
    forgotText: {
        fontSize: 14,
        color: '#7c3aed',
        fontWeight: '500',
    },
    submitButton: {
        backgroundColor: '#7c3aed',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
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
    disabledButton: {
        opacity: 0.5,
    },
    socialIcon: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
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
    createAccountText: {
        fontSize: 14,
        color: '#7c3aed',
        fontWeight: '600',
    },
});

export default LoginScreen;
