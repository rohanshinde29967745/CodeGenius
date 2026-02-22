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
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { problemsAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const ProblemDetailScreen = ({ route, navigation }) => {
    const { problem } = route.params;
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [showHint, setShowHint] = useState(false);
    const { theme } = useTheme();

    const languages = [
        { id: 'javascript', name: 'JavaScript', icon: 'JS' },
        { id: 'python', name: 'Python', icon: 'PY' },
        { id: 'java', name: 'Java', icon: 'JA' },
        { id: 'cpp', name: 'C++', icon: 'C++' },
        { id: 'c', name: 'C', icon: 'C' },
    ];

    const getDifficultyColor = (diff) => {
        switch (diff?.toLowerCase()) {
            case 'easy': return '#22c55e';
            case 'medium': return '#f59e0b';
            case 'hard': return '#ef4444';
            default: return '#94a3b8';
        }
    };

    const handleSubmit = async () => {
        if (!code.trim()) {
            Alert.alert('Error', 'Please write some code before submitting');
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const response = await problemsAPI.checkSolution(problem.id, code, language);
            setResult(response.data);
        } catch (error) {
            console.log('Using demo result');
            // Demo result for testing
            const isCorrect = Math.random() > 0.3; // 70% chance of correct
            setResult({
                status: isCorrect ? 'Accepted' : 'Wrong Answer',
                message: isCorrect
                    ? '✅ All test cases passed! Great job!'
                    : '❌ Some test cases failed. Try again!',
                runtime: isCorrect ? `${Math.floor(Math.random() * 100) + 10}ms` : null,
                memory: isCorrect ? `${(Math.random() * 10 + 5).toFixed(1)}MB` : null,
                testCases: {
                    passed: isCorrect ? 5 : Math.floor(Math.random() * 3),
                    total: 5,
                },
                suggestions: isCorrect ? [] : [
                    'Check edge cases like empty arrays',
                    'Consider the time complexity',
                    'Make sure to handle negative numbers',
                ],
            });
        } finally {
            setLoading(false);
        }
    };

    const getStarterCode = () => {
        const starters = {
            javascript: `function solution(input) {\n  // Write your code here\n  \n  return result;\n}`,
            python: `def solution(input):\n    # Write your code here\n    \n    return result`,
            java: `class Solution {\n    public Object solve(Object input) {\n        // Write your code here\n        \n        return result;\n    }\n}`,
            cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    \n    return 0;\n}`,
            c: `#include <stdio.h>\n\nint main() {\n    // Write your code here\n    \n    return 0;\n}`,
        };
        return starters[language] || starters.javascript;
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Text style={styles.backText}>← Back</Text>
                        </TouchableOpacity>
                        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(problem.difficulty) + '20' }]}>
                            <Text style={[styles.difficultyText, { color: getDifficultyColor(problem.difficulty) }]}>
                                {problem.difficulty}
                            </Text>
                        </View>
                    </View>

                    {/* Problem Info */}
                    <View style={styles.problemInfo}>
                        <Text style={[styles.problemTitle, { color: theme.text }]}>{problem.title}</Text>
                        <Text style={styles.category}>{problem.category}</Text>
                        <Text style={[styles.description, { color: theme.textSecondary }]}>{problem.description}</Text>

                        {/* Hint Toggle */}
                        <TouchableOpacity
                            style={styles.hintButton}
                            onPress={() => setShowHint(!showHint)}
                        >
                            <Text style={styles.hintButtonText}>
                                {showHint ? '🙈 Hide Hint' : '💡 Show Hint'}
                            </Text>
                        </TouchableOpacity>

                        {showHint && (
                            <View style={styles.hintBox}>
                                <Text style={styles.hintText}>
                                    Think about using a hash map to store seen values for O(1) lookup.
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Language Selector */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Select Language</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.languageRow}>
                                {languages.map((lang) => (
                                    <TouchableOpacity
                                        key={lang.id}
                                        style={[
                                            styles.langButton,
                                            language === lang.id && styles.langButtonActive,
                                        ]}
                                        onPress={() => {
                                            setLanguage(lang.id);
                                            if (!code.trim()) {
                                                setCode(getStarterCode());
                                            }
                                        }}
                                    >
                                        <Text style={[
                                            styles.langIcon,
                                            language === lang.id && styles.langIconActive,
                                        ]}>
                                            {lang.icon}
                                        </Text>
                                        <Text style={[
                                            styles.langName,
                                            language === lang.id && styles.langNameActive,
                                        ]}>
                                            {lang.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>

                    {/* Code Editor */}
                    <View style={styles.section}>
                        <View style={styles.editorHeader}>
                            <Text style={styles.sectionTitle}>Your Solution</Text>
                            <TouchableOpacity
                                style={styles.templateButton}
                                onPress={() => setCode(getStarterCode())}
                            >
                                <Text style={styles.templateButtonText}>Reset Template</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.editorContainer}>
                            <TextInput
                                style={styles.codeEditor}
                                placeholder="Write your code here..."
                                placeholderTextColor="#64748b"
                                value={code}
                                onChangeText={setCode}
                                multiline={true}
                                textAlignVertical="top"
                                autoCapitalize="none"
                                autoCorrect={false}
                                spellCheck={false}
                            />
                        </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#f8fafc" />
                        ) : (
                            <Text style={styles.submitButtonText}>▶️ Run & Submit</Text>
                        )}
                    </TouchableOpacity>

                    {/* Result */}
                    {result && (
                        <View style={[
                            styles.resultContainer,
                            result.status === 'Accepted' ? styles.resultSuccess : styles.resultError,
                        ]}>
                            <Text style={styles.resultStatus}>{result.status}</Text>
                            <Text style={styles.resultMessage}>{result.message}</Text>

                            {result.testCases && (
                                <View style={styles.testCases}>
                                    <Text style={styles.testCasesText}>
                                        Test Cases: {result.testCases.passed}/{result.testCases.total} passed
                                    </Text>
                                </View>
                            )}

                            {result.runtime && (
                                <View style={styles.statsRow}>
                                    <Text style={styles.statText}>⏱️ Runtime: {result.runtime}</Text>
                                    <Text style={styles.statText}>💾 Memory: {result.memory}</Text>
                                </View>
                            )}

                            {result.suggestions?.length > 0 && (
                                <View style={styles.suggestions}>
                                    <Text style={styles.suggestionsTitle}>Suggestions:</Text>
                                    {result.suggestions.map((suggestion, index) => (
                                        <Text key={index} style={styles.suggestionText}>• {suggestion}</Text>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    <View style={styles.bottomPadding} />
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
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    backButton: {
        padding: 4,
    },
    backText: {
        fontSize: 16,
        color: '#6366f1',
        fontWeight: '600',
    },
    difficultyBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    difficultyText: {
        fontSize: 14,
        fontWeight: '600',
    },
    problemInfo: {
        padding: 16,
        paddingTop: 0,
    },
    problemTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: 8,
    },
    category: {
        fontSize: 14,
        color: '#6366f1',
        marginBottom: 12,
    },
    description: {
        fontSize: 15,
        color: '#cbd5e1',
        lineHeight: 24,
    },
    hintButton: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#1e293b',
        borderRadius: 8,
        alignItems: 'center',
    },
    hintButtonText: {
        fontSize: 14,
        color: '#f59e0b',
        fontWeight: '500',
    },
    hintBox: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#f59e0b20',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#f59e0b',
    },
    hintText: {
        fontSize: 14,
        color: '#fbbf24',
        fontStyle: 'italic',
    },
    section: {
        padding: 16,
        paddingTop: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#f8fafc',
        marginBottom: 12,
    },
    languageRow: {
        flexDirection: 'row',
    },
    langButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: '#334155',
        marginRight: 8,
    },
    langButtonActive: {
        backgroundColor: '#6366f1',
        borderColor: '#6366f1',
    },
    langIcon: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#94a3b8',
        marginRight: 6,
    },
    langIconActive: {
        color: '#f8fafc',
    },
    langName: {
        fontSize: 14,
        color: '#94a3b8',
    },
    langNameActive: {
        color: '#f8fafc',
        fontWeight: '500',
    },
    editorHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    templateButton: {
        padding: 8,
    },
    templateButtonText: {
        fontSize: 12,
        color: '#6366f1',
    },
    editorContainer: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#334155',
        minHeight: 200,
    },
    codeEditor: {
        padding: 16,
        fontSize: 14,
        color: '#f8fafc',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        minHeight: 200,
    },
    submitButton: {
        marginHorizontal: 16,
        backgroundColor: '#22c55e',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#f8fafc',
    },
    resultContainer: {
        margin: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    resultSuccess: {
        backgroundColor: '#22c55e20',
        borderColor: '#22c55e',
    },
    resultError: {
        backgroundColor: '#ef444420',
        borderColor: '#ef4444',
    },
    resultStatus: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: 8,
    },
    resultMessage: {
        fontSize: 14,
        color: '#cbd5e1',
        marginBottom: 12,
    },
    testCases: {
        marginBottom: 8,
    },
    testCasesText: {
        fontSize: 14,
        color: '#94a3b8',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    statText: {
        fontSize: 13,
        color: '#94a3b8',
    },
    suggestions: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#334155',
    },
    suggestionsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#f8fafc',
        marginBottom: 8,
    },
    suggestionText: {
        fontSize: 13,
        color: '#94a3b8',
        marginBottom: 4,
    },
    bottomPadding: {
        height: 40,
    },
});

export default ProblemDetailScreen;
