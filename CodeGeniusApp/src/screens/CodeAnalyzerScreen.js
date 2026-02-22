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
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const CodeAnalyzerScreen = ({ navigation }) => {
    const [inputCode, setInputCode] = useState('');
    const [language, setLanguage] = useState('JavaScript');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('explanation');
    const [analysisResult, setAnalysisResult] = useState(null);
    const [error, setError] = useState('');
    const { theme } = useTheme();

    const languages = ['JavaScript', 'Python', 'C++', 'Java'];
    const tabs = ['explanation', 'errors', 'complexity', 'flowchart', 'optimized'];

    // Handle file upload
    const handleFileUpload = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['text/*', 'application/javascript', 'text/x-python', 'text/x-java-source', 'text/x-c++src'],
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const file = result.assets[0];
            const content = await FileSystem.readAsStringAsync(file.uri);
            setInputCode(content);

            // Try to auto-detect language from extension
            const ext = file.name.split('.').pop().toLowerCase();
            if (ext === 'js' || ext === 'jsx' || ext === 'ts') setLanguage('JavaScript');
            else if (ext === 'py') setLanguage('Python');
            else if (ext === 'java') setLanguage('Java');
            else if (ext === 'cpp' || ext === 'c') setLanguage('C++');

        } catch (err) {
            console.error('File read error:', err);
            Alert.alert('Error', 'Failed to read file content');
        }
    };

    // Analyze code using real API
    const handleAnalyze = async () => {
        if (!inputCode.trim()) {
            Alert.alert('Error', 'Please paste or type your code first.');
            return;
        }

        setLoading(true);
        setError('');
        setAnalysisResult(null);

        try {
            const response = await api.post('/analyze', {
                inputCode,
                language,
            });

            setAnalysisResult(response.data);
        } catch (err) {
            console.error('Analysis error:', err);
            setError('Failed to analyze code. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    // Get content for current tab
    const getTabContent = () => {
        if (!analysisResult) return null;

        switch (activeTab) {
            case 'explanation':
                return analysisResult.explanation;
            case 'errors':
                return analysisResult.errors;
            case 'complexity':
                return analysisResult.complexity;
            case 'flowchart':
                return analysisResult.flowchart;
            case 'optimized':
                return analysisResult.optimized;
            default:
                return null;
        }
    };

    // Render content based on type
    const renderContent = (content) => {
        if (!content) return <Text style={styles.emptyText}>— Nothing to show —</Text>;

        if (Array.isArray(content)) {
            if (content.length === 0) return <Text style={styles.emptyText}>— Nothing to show —</Text>;
            return (
                <View>
                    {content.map((item, i) => (
                        <Text key={i} style={styles.listItem}>
                            {i + 1}. {typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)}
                        </Text>
                    ))}
                </View>
            );
        }

        if (typeof content === 'object') {
            return (
                <View>
                    {Object.entries(content).map(([key, value]) => (
                        <View key={key} style={styles.objectItem}>
                            <Text style={styles.objectKey}>{key}:</Text>
                            <Text style={styles.objectValue}>
                                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                            </Text>
                        </View>
                    ))}
                </View>
            );
        }

        return <Text style={styles.contentText}>{String(content)}</Text>;
    };

    const handleClear = () => {
        setInputCode('');
        setAnalysisResult(null);
        setError('');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerRow}>
                        <View>
                            <Text style={[styles.title, { color: theme.text }]}>Code Analyzer</Text>
                            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Get AI-powered insights for your code</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.converterButton}
                            onPress={() => navigation.navigate('CodeConverter')}
                        >
                            <Text style={styles.converterButtonText}>🔄 Convert</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Code Input Card */}
                <View style={[styles.card, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
                    <View style={styles.cardHeader}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.cardTitle}>{'</>'} Code Input</Text>
                            <TouchableOpacity style={styles.uploadButton} onPress={handleFileUpload}>
                                <Text style={styles.uploadButtonText}>📂 Upload File</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.langBadge}>
                            <Text style={styles.langBadgeText}>{language}</Text>
                        </View>
                    </View>

                    {/* Language Selector */}
                    <View style={styles.langRow}>
                        {languages.map((lang) => (
                            <TouchableOpacity
                                key={lang}
                                style={[
                                    styles.langButton,
                                    { backgroundColor: theme.inputBackground, borderColor: theme.border },
                                    language === lang && styles.langButtonActive,
                                ]}
                                onPress={() => setLanguage(lang)}
                            >
                                <Text style={[
                                    styles.langButtonText,
                                    { color: theme.textSecondary },
                                    language === lang && styles.langButtonTextActive,
                                ]}>
                                    {lang}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Code Editor with Line Numbers */}
                    <View style={[styles.editorContainer, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
                        <View style={[styles.lineNumbers, { backgroundColor: theme.backgroundSecondary, borderRightColor: theme.border }]}>
                            {inputCode.split('\n').map((_, i) => (
                                <Text key={i} style={[styles.lineNumberText, { color: theme.textMuted }]}>{i + 1}</Text>
                            ))}
                        </View>
                        <TextInput
                            style={[styles.codeInput, { color: theme.text, backgroundColor: theme.inputBackground }]}
                            placeholder="Paste your code here..."
                            placeholderTextColor={theme.textMuted}
                            value={inputCode}
                            onChangeText={setInputCode}
                            multiline={true}
                            textAlignVertical="top"
                            autoCapitalize="none"
                            autoCorrect={false}
                            spellCheck={false}
                        />
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                        {inputCode.length > 0 && (
                            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                                <Text style={styles.clearButtonText}>Clear</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.analyzeButton, loading && styles.buttonDisabled]}
                        onPress={handleAnalyze}
                        disabled={loading}
                    >
                        {loading ? (
                            <View style={styles.loadingRow}>
                                <ActivityIndicator color="#f8fafc" size="small" />
                                <Text style={styles.analyzeButtonText}>  Analyzing...</Text>
                            </View>
                        ) : (
                            <Text style={styles.analyzeButtonText}>▶ Analyze Code</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Results Card */}
                <View style={[styles.card, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Analysis Results</Text>
                    <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>AI-powered insights about your code</Text>

                    {/* Tab Bar */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
                        <View style={styles.tabBar}>
                            {tabs.map((tab) => (
                                <TouchableOpacity
                                    key={tab}
                                    style={[
                                        styles.tabButton,
                                        { backgroundColor: theme.inputBackground, borderColor: theme.border },
                                        activeTab === tab && styles.tabButtonActive,
                                    ]}
                                    onPress={() => setActiveTab(tab)}
                                >
                                    <Text style={[
                                        styles.tabButtonText,
                                        { color: theme.textSecondary },
                                        activeTab === tab && styles.tabButtonTextActive,
                                    ]}>
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>

                    {/* Tab Content */}
                    <View style={[styles.analysisBox, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
                        {loading && (
                            <View style={styles.loadingMessage}>
                                <ActivityIndicator color="#6366f1" />
                                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Analyzing your code...</Text>
                            </View>
                        )}

                        {error && (
                            <View style={styles.errorMessage}>
                                <Text style={styles.errorText}>❌ {error}</Text>
                            </View>
                        )}

                        {!loading && !error && !analysisResult && (
                            <Text style={styles.emptyText}>
                                Paste your code and click "Analyze Code" to see results
                            </Text>
                        )}

                        {!loading && !error && analysisResult && (
                            <View style={styles.resultContent}>
                                {renderContent(getTabContent())}
                            </View>
                        )}
                    </View>
                </View>

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
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        alignItems: 'flex-end',
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
    converterButton: {
        backgroundColor: '#334155',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    converterButtonText: {
        fontSize: 12,
        color: '#f8fafc',
        fontWeight: '500',
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
    cardSubtitle: {
        fontSize: 13,
        color: '#94a3b8',
        marginBottom: 12,
    },
    langBadge: {
        backgroundColor: '#6366f120',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    langBadgeText: {
        fontSize: 12,
        color: '#a5b4fc',
        fontWeight: '500',
    },
    uploadButton: {
        backgroundColor: '#334155',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    uploadButtonText: {
        fontSize: 11,
        color: '#f8fafc',
        fontWeight: '500',
    },
    langRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 12,
    },
    langButton: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 8,
        backgroundColor: '#0f172a',
        marginRight: 8,
        marginBottom: 8,
    },
    langButtonActive: {
        backgroundColor: '#6366f1',
    },
    langButtonText: {
        fontSize: 13,
        color: '#94a3b8',
    },
    langButtonTextActive: {
        color: '#f8fafc',
        fontWeight: '500',
    },
    editorContainer: {
        backgroundColor: '#0f172a',
        borderRadius: 12,
        minHeight: 180,
        borderWidth: 1,
        borderColor: '#334155',
        flexDirection: 'row',
        overflow: 'hidden',
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
        paddingTop: 16, // Match line number padding
        fontSize: 14,
        color: '#f8fafc',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        minHeight: 180,
        lineHeight: 20,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
    },
    clearButton: {
        padding: 8,
    },
    clearButtonText: {
        fontSize: 13,
        color: '#ef4444',
    },
    analyzeButton: {
        backgroundColor: '#6366f1',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    analyzeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#f8fafc',
    },
    tabScroll: {
        marginBottom: 12,
    },
    tabBar: {
        flexDirection: 'row',
    },
    tabButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#0f172a',
        marginRight: 8,
    },
    tabButtonActive: {
        backgroundColor: '#6366f1',
    },
    tabButtonText: {
        fontSize: 13,
        color: '#94a3b8',
    },
    tabButtonTextActive: {
        color: '#f8fafc',
        fontWeight: '500',
    },
    analysisBox: {
        backgroundColor: '#0f172a',
        borderRadius: 12,
        padding: 16,
        minHeight: 150,
    },
    loadingMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
    },
    loadingText: {
        fontSize: 14,
        color: '#94a3b8',
        marginLeft: 12,
    },
    errorMessage: {
        paddingVertical: 16,
    },
    errorText: {
        fontSize: 14,
        color: '#ef4444',
    },
    emptyText: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        paddingVertical: 32,
    },
    resultContent: {
        paddingVertical: 8,
    },
    contentText: {
        fontSize: 14,
        color: '#cbd5e1',
        lineHeight: 22,
    },
    listItem: {
        fontSize: 14,
        color: '#cbd5e1',
        marginBottom: 12,
        lineHeight: 22,
    },
    objectItem: {
        marginBottom: 12,
    },
    objectKey: {
        fontSize: 14,
        fontWeight: '600',
        color: '#f8fafc',
        marginBottom: 4,
    },
    objectValue: {
        fontSize: 14,
        color: '#cbd5e1',
        lineHeight: 22,
    },
    bottomPadding: {
        height: 40,
    },
});

export default CodeAnalyzerScreen;
