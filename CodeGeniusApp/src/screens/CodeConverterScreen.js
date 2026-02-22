import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const CodeConverterScreen = ({ navigation }) => {
    const [sourceCode, setSourceCode] = useState('');
    const [convertedCode, setConvertedCode] = useState('');
    const [fromLanguage, setFromLanguage] = useState('JavaScript');
    const [toLanguage, setToLanguage] = useState('Python');
    const [loading, setLoading] = useState(false);
    const { theme } = useTheme();

    const languages = ['JavaScript', 'Python', 'C++', 'Java'];

    const handleConvert = async () => {
        if (!sourceCode.trim()) {
            Alert.alert('Error', 'Please enter some code to convert');
            return;
        }

        if (fromLanguage === toLanguage) {
            Alert.alert('Error', 'Please select different source and target languages');
            return;
        }

        setLoading(true);
        setConvertedCode('');

        try {
            const response = await api.post('/convert', {
                inputCode: sourceCode,
                sourceLanguage: fromLanguage,
                targetLanguage: toLanguage,
            });

            setConvertedCode(response.data?.convertedCode || response.data?.code || response.data || '');
        } catch (error) {
            console.error('Convert error:', error);
            Alert.alert('Error', 'Failed to convert code. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        if (convertedCode) {
            await Clipboard.setStringAsync(convertedCode);
            Alert.alert('Copied!', 'Converted code copied to clipboard');
        }
    };

    const handleDownload = async () => {
        if (!convertedCode) return;

        try {
            const ext = toLanguage === 'Python' ? 'py' :
                toLanguage === 'JavaScript' ? 'js' :
                    toLanguage === 'Java' ? 'java' : 'cpp';

            const filename = `converted_code.${ext}`;
            const fileUri = FileSystem.documentDirectory + filename;

            await FileSystem.writeAsStringAsync(fileUri, convertedCode);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert('Error', 'Sharing is not available on this device');
            }
        } catch (error) {
            console.error('Download error:', error);
            Alert.alert('Error', 'Failed to save file');
        }
    };

    const handleSwapLanguages = () => {
        setFromLanguage(toLanguage);
        setToLanguage(fromLanguage);
        setSourceCode(convertedCode);
        setConvertedCode('');
    };

    const handleClear = () => {
        setSourceCode('');
        setConvertedCode('');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backText}>← Back to Analyzer</Text>
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: theme.text }]}>Code Converter</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Convert code between programming languages</Text>
                </View>

                {/* Language Selectors */}
                <View style={styles.languageSection}>
                    {/* From Language */}
                    <View style={styles.langSelector}>
                        <Text style={styles.langLabel}>FROM</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.langRow}>
                                {languages.map((lang) => (
                                    <TouchableOpacity
                                        key={`from-${lang}`}
                                        style={[
                                            styles.langButton,
                                            fromLanguage === lang && styles.langButtonActiveBlue,
                                        ]}
                                        onPress={() => setFromLanguage(lang)}
                                    >
                                        <Text style={[
                                            styles.langButtonText,
                                            fromLanguage === lang && styles.langButtonTextActive,
                                        ]}>
                                            {lang}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>

                    {/* Swap Button */}
                    <TouchableOpacity style={styles.swapButton} onPress={handleSwapLanguages}>
                        <Text style={styles.swapIcon}>⇅</Text>
                    </TouchableOpacity>

                    {/* To Language */}
                    <View style={styles.langSelector}>
                        <Text style={styles.langLabel}>TO</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.langRow}>
                                {languages.map((lang) => (
                                    <TouchableOpacity
                                        key={`to-${lang}`}
                                        style={[
                                            styles.langButton,
                                            toLanguage === lang && styles.langButtonActiveGreen,
                                        ]}
                                        onPress={() => setToLanguage(lang)}
                                    >
                                        <Text style={[
                                            styles.langButtonText,
                                            toLanguage === lang && styles.langButtonTextActive,
                                        ]}>
                                            {lang}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                </View>

                {/* Source Code Input */}
                <View style={[styles.card, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>Source Code ({fromLanguage})</Text>
                        {sourceCode.length > 0 && (
                            <TouchableOpacity onPress={handleClear}>
                                <Text style={styles.clearText}>Clear</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={[styles.editorContainer, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
                        <View style={[styles.lineNumbers, { backgroundColor: theme.backgroundSecondary, borderRightColor: theme.border }]}>
                            {sourceCode.split('\n').map((_, i) => (
                                <Text key={i} style={[styles.lineNumberText, { color: theme.textMuted }]}>{i + 1}</Text>
                            ))}
                        </View>
                        <TextInput
                            style={[styles.codeInput, { color: theme.text, backgroundColor: theme.inputBackground }]}
                            placeholder="Paste your source code here..."
                            placeholderTextColor={theme.textMuted}
                            value={sourceCode}
                            onChangeText={setSourceCode}
                            multiline={true}
                            textAlignVertical="top"
                            autoCapitalize="none"
                            autoCorrect={false}
                            spellCheck={false}
                        />
                    </View>
                </View>

                {/* Convert Button */}
                <TouchableOpacity
                    style={[styles.convertButton, loading && styles.buttonDisabled]}
                    onPress={handleConvert}
                    disabled={loading}
                >
                    {loading ? (
                        <View style={styles.loadingRow}>
                            <ActivityIndicator color="#f8fafc" size="small" />
                            <Text style={styles.convertButtonText}>  Converting...</Text>
                        </View>
                    ) : (
                        <Text style={styles.convertButtonText}>🔄 Convert Code</Text>
                    )}
                </TouchableOpacity>

                {/* Converted Code Output */}
                {convertedCode ? (
                    <View style={[styles.card, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
                        <View style={styles.cardHeader}>
                            <Text style={[styles.cardTitle, { color: theme.text }]}>Converted Code ({toLanguage})</Text>
                            <View style={styles.headerRight}>
                                <TouchableOpacity onPress={handleDownload} style={styles.actionBtn}>
                                    <Text style={styles.actionBtnText}>💾 Save</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleCopy} style={styles.actionBtn}>
                                    <Text style={styles.actionBtnText}>📋 Copy</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={[styles.editorContainer, styles.outputContainer, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
                            <View style={[styles.lineNumbers, { backgroundColor: theme.backgroundSecondary, borderRightColor: theme.border }]}>
                                {convertedCode.split('\n').map((_, i) => (
                                    <Text key={i} style={[styles.lineNumberText, { color: theme.textMuted }]}>{i + 1}</Text>
                                ))}
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.codeScroll}>
                                <Text style={[styles.codeOutput, { color: theme.text }]}>{convertedCode}</Text>
                            </ScrollView>
                        </View>
                    </View>
                ) : null}

                <View style={styles.bottomPadding} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        padding: 16,
        paddingBottom: 8,
    },
    backButton: {
        marginBottom: 12,
    },
    backText: {
        fontSize: 14,
        color: '#6366f1',
        fontWeight: '500',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    subtitle: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 4,
    },
    languageSection: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    langSelector: {
        marginBottom: 8,
    },
    langLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    langRow: {
        flexDirection: 'row',
    },
    langButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: '#334155',
        marginRight: 8,
    },
    langButtonActiveBlue: {
        backgroundColor: '#6366f1',
        borderColor: '#6366f1',
    },
    langButtonActiveGreen: {
        backgroundColor: '#22c55e',
        borderColor: '#22c55e',
    },
    langButtonText: {
        fontSize: 13,
        color: '#94a3b8',
    },
    langButtonTextActive: {
        color: '#f8fafc',
        fontWeight: '500',
    },
    swapButton: {
        alignSelf: 'center',
        backgroundColor: '#334155',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 8,
    },
    swapIcon: {
        fontSize: 20,
        color: '#f8fafc',
    },
    card: {
        marginHorizontal: 16,
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#f8fafc',
    },
    clearText: {
        fontSize: 13,
        color: '#ef4444',
    },
    copyText: {
        fontSize: 13,
        color: '#6366f1',
    },
    editorContainer: {
        backgroundColor: '#0f172a',
        borderRadius: 12,
        minHeight: 150,
        borderWidth: 1,
        borderColor: '#334155',
        flexDirection: 'row',
        overflow: 'hidden',
    },
    outputContainer: {
        borderColor: '#22c55e',
    },
    lineNumbers: {
        backgroundColor: '#1e293b',
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderRightWidth: 1,
        borderRightColor: '#334155',
        alignItems: 'flex-end',
        minWidth: 36,
    },
    lineNumberText: {
        color: '#64748b',
        fontSize: 14,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        lineHeight: 20,
    },
    codeInput: {
        flex: 1,
        padding: 16,
        paddingTop: 16,
        fontSize: 14,
        color: '#f8fafc',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        minHeight: 150,
        lineHeight: 20,
    },
    codeScroll: {
        flex: 1,
    },
    codeOutput: {
        padding: 16,
        paddingTop: 16,
        fontSize: 14,
        color: '#a5b4fc',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        lineHeight: 20,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBtn: {
        marginLeft: 12,
        backgroundColor: '#334155',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    actionBtnText: {
        fontSize: 12,
        color: '#f8fafc',
        fontWeight: '500',
    },
    convertButton: {
        marginHorizontal: 16,
        backgroundColor: '#6366f1',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    convertButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#f8fafc',
    },
    bottomPadding: {
        height: 40,
    },
});

export default CodeConverterScreen;
