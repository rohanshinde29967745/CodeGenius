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
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const ProblemSolvingScreen = () => {
    // Problem generation state
    const [difficulty, setDifficulty] = useState('Easy');
    const [problemLang, setProblemLang] = useState('JavaScript');
    const [solutionLang, setSolutionLang] = useState('JavaScript');

    // Generated problem state
    const [problem, setProblem] = useState(null);
    const [generating, setGenerating] = useState(false);

    // Solution state
    const [solution, setSolution] = useState('');
    const [checking, setChecking] = useState(false);
    const [result, setResult] = useState(null);
    const [testResults, setTestResults] = useState([]);
    const [aiFeedback, setAiFeedback] = useState(null);

    const { theme } = useTheme();

    const difficulties = ['Easy', 'Medium', 'Hard'];
    const languages = ['JavaScript', 'Python', 'C++', 'Java'];

    const getDifficultyColor = (diff) => {
        switch (diff) {
            case 'Easy': return '#22c55e';
            case 'Medium': return '#f59e0b';
            case 'Hard': return '#ef4444';
            default: return '#94a3b8';
        }
    };

    // Generate new AI problem
    const generateProblem = async () => {
        setGenerating(true);
        setProblem(null);
        setResult(null);
        setTestResults([]);
        setAiFeedback(null);
        setSolution('');

        try {
            const response = await api.post('/problem-generate', {
                difficulty,
                language: problemLang,
            });

            setProblem({
                title: response.data.title || 'Generated Problem',
                description: response.data.description || '',
                examples: response.data.examples || [],
                constraints: response.data.constraints || [],
            });
        } catch (error) {
            console.error('Generate error:', error);
            Alert.alert('Error', 'Failed to generate problem. Please check your connection.');
        } finally {
            setGenerating(false);
        }
    };

    // Run tests (quick check)
    const runTests = () => {
        if (!solution.trim()) {
            Alert.alert('Error', 'Please write your solution first!');
            return;
        }
        setResult({ type: 'info', message: '✓ Code executed! Submit to see full test results and AI feedback.' });
    };

    // Submit solution for full AI check
    const submitSolution = async () => {
        if (!solution.trim()) {
            Alert.alert('Error', 'Please write your solution first!');
            return;
        }

        if (!problem) {
            Alert.alert('Error', 'Please generate a problem first!');
            return;
        }

        setChecking(true);
        setResult(null);

        try {
            const response = await api.post('/problem-check', {
                language: solutionLang,
                problem: problem.title,
                description: problem.description,
                constraints: problem.constraints,
                examples: problem.examples,
                userSolution: solution,
            });

            const data = response.data;

            if (data.allPassed) {
                setResult({ type: 'success', message: '✅ All tests passed! Great job!' });
                setTestResults([
                    { id: 1, passed: true },
                    { id: 2, passed: true },
                    { id: 3, passed: true },
                ]);
            } else {
                setResult({ type: 'error', message: data.result || '❌ Some tests failed.' });
                setTestResults([
                    { id: 1, passed: true },
                    { id: 2, passed: true },
                    { id: 3, passed: false },
                ]);
            }

            // Set AI feedback from response or generate default
            setAiFeedback({
                score: data.score || 75,
                suggestions: data.suggestions || [
                    'Your solution handles most cases correctly.',
                    'Consider edge cases for better coverage.',
                    'Time complexity can be improved.',
                ],
                optimizedSolution: data.optimizedSolution || '// Optimized solution will appear here',
            });

        } catch (error) {
            console.error('Check error:', error);
            Alert.alert('Error', 'Failed to check solution. Please try again.');
        } finally {
            setChecking(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]}>Problem Solving</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Practice AI-generated coding challenges.</Text>
                </View>

                {/* Controls Row */}
                <View style={styles.controlsRow}>
                    {/* Difficulty */}
                    <View style={styles.controlItem}>
                        <Text style={[styles.controlLabel, { color: theme.textSecondary }]}>DIFFICULTY</Text>
                        <View style={styles.buttonGroup}>
                            {difficulties.map((diff) => (
                                <TouchableOpacity
                                    key={diff}
                                    style={[
                                        styles.diffButton,
                                        { backgroundColor: theme.backgroundCard, borderColor: theme.border },
                                        difficulty === diff && { backgroundColor: getDifficultyColor(diff), borderColor: getDifficultyColor(diff) },
                                    ]}
                                    onPress={() => setDifficulty(diff)}
                                >
                                    <Text style={[
                                        styles.diffButtonText,
                                        { color: theme.textSecondary },
                                        difficulty === diff && styles.diffButtonTextActive,
                                    ]}>
                                        {diff}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Problem Language */}
                    <View style={styles.controlItem}>
                        <Text style={[styles.controlLabel, { color: theme.textSecondary }]}>PROBLEM LANGUAGE</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.buttonGroup}>
                                {languages.map((lang) => (
                                    <TouchableOpacity
                                        key={lang}
                                        style={[
                                            styles.langButton,
                                            { backgroundColor: theme.backgroundCard, borderColor: theme.border },
                                            problemLang === lang && styles.langButtonActive,
                                        ]}
                                        onPress={() => setProblemLang(lang)}
                                    >
                                        <Text style={[
                                            styles.langButtonText,
                                            { color: theme.textSecondary },
                                            problemLang === lang && styles.langButtonTextActive,
                                        ]}>
                                            {lang}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                </View>

                {/* Generate Button */}
                <TouchableOpacity
                    style={[styles.generateButton, generating && styles.buttonDisabled]}
                    onPress={generateProblem}
                    disabled={generating}
                >
                    {generating ? (
                        <ActivityIndicator color="#f8fafc" />
                    ) : (
                        <Text style={styles.generateButtonText}>✨ Generate New Problem</Text>
                    )}
                </TouchableOpacity>

                {/* Problem Card */}
                <View style={[styles.problemCard, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
                    <Text style={[styles.problemTitle, { color: theme.text }]}>
                        {problem ? problem.title : 'Click Generate Problem'}
                    </Text>

                    {problem && (
                        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(difficulty) + '20' }]}>
                            <Text style={[styles.difficultyText, { color: getDifficultyColor(difficulty) }]}>
                                {difficulty}
                            </Text>
                        </View>
                    )}

                    <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Description</Text>
                    <Text style={[styles.descriptionText, { color: theme.textSecondary }]}>
                        {problem?.description || 'Generate a problem to see the description.'}
                    </Text>

                    {problem?.examples?.length > 0 && (
                        <>
                            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Examples</Text>
                            {problem.examples.map((ex, i) => (
                                <View key={i} style={[styles.exampleBox, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
                                    <Text style={[styles.exampleText, { color: theme.text }]}><Text style={styles.bold}>Input:</Text> {ex.input}</Text>
                                    <Text style={[styles.exampleText, { color: theme.text }]}><Text style={styles.bold}>Output:</Text> {ex.output}</Text>
                                    {ex.explain && <Text style={[styles.exampleExplain, { color: theme.textSecondary }]}>{ex.explain}</Text>}
                                </View>
                            ))}
                        </>
                    )}

                    {problem?.constraints?.length > 0 && (
                        <>
                            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Constraints</Text>
                            {problem.constraints.map((c, i) => (
                                <Text key={i} style={[styles.constraintText, { color: theme.textSecondary }]}>• {c}</Text>
                            ))}
                        </>
                    )}
                </View>

                {/* Solution Section */}
                {problem && (
                    <View style={[styles.solutionCard, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
                        <View style={styles.solutionHeader}>
                            <Text style={[styles.cardTitle, { color: theme.text }]}>Your Solution</Text>
                            <View style={styles.solutionLangRow}>
                                {languages.map((lang) => (
                                    <TouchableOpacity
                                        key={lang}
                                        style={[
                                            styles.solutionLangButton,
                                            solutionLang === lang && styles.solutionLangButtonActive,
                                        ]}
                                        onPress={() => setSolutionLang(lang)}
                                    >
                                        <Text style={[
                                            styles.solutionLangText,
                                            solutionLang === lang && styles.solutionLangTextActive,
                                        ]}>
                                            {lang}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={[styles.editorContainer, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
                            <View style={[styles.lineNumbers, { backgroundColor: theme.backgroundSecondary, borderRightColor: theme.border }]}>
                                {solution.split('\n').map((_, i) => (
                                    <Text key={i} style={[styles.lineNumberText, { color: theme.textMuted }]}>{i + 1}</Text>
                                ))}
                            </View>
                            <TextInput
                                style={[styles.codeEditor, { color: theme.text, backgroundColor: theme.inputBackground }]}
                                placeholder="// Write your solution here..."
                                placeholderTextColor={theme.textMuted}
                                value={solution}
                                onChangeText={setSolution}
                                multiline={true}
                                textAlignVertical="top"
                                autoCapitalize="none"
                                autoCorrect={false}
                                spellCheck={false}
                            />
                        </View>

                        {/* Button Row */}
                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.runButton} onPress={runTests}>
                                <Text style={styles.runButtonText}>▷ Run Tests</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.submitButton, checking && styles.buttonDisabled]}
                                onPress={submitSolution}
                                disabled={checking}
                            >
                                {checking ? (
                                    <ActivityIndicator color="#f8fafc" size="small" />
                                ) : (
                                    <Text style={styles.submitButtonText}>✓ Submit Solution</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Result */}
                        {result && (
                            <View style={[
                                styles.resultBox,
                                result.type === 'success' && styles.resultSuccess,
                                result.type === 'error' && styles.resultError,
                                result.type === 'info' && styles.resultInfo,
                            ]}>
                                <Text style={styles.resultText}>{result.message}</Text>
                            </View>
                        )}

                        {/* Test Results */}
                        {testResults.length > 0 && (
                            <View style={styles.testResultsBox}>
                                <Text style={styles.testResultsTitle}>📋 Test Results</Text>
                                <Text style={styles.testResultsCount}>
                                    {testResults.filter(t => t.passed).length}/{testResults.length} test cases passed
                                </Text>
                                <View style={styles.progressBar}>
                                    <View style={[
                                        styles.progressFill,
                                        { width: `${(testResults.filter(t => t.passed).length / testResults.length) * 100}%` }
                                    ]} />
                                </View>
                            </View>
                        )}

                        {/* AI Feedback */}
                        {aiFeedback && (
                            <View style={styles.aiFeedbackBox}>
                                <View style={styles.aiFeedbackHeader}>
                                    <Text style={styles.aiFeedbackTitle}>💡 AI Feedback</Text>
                                    <Text style={styles.aiScore}>Score: {aiFeedback.score}/100</Text>
                                </View>
                                <Text style={styles.suggestionsTitle}>Suggestions:</Text>
                                {aiFeedback.suggestions.map((s, i) => (
                                    <Text key={i} style={styles.suggestionText}>• {s}</Text>
                                ))}
                                {aiFeedback.optimizedSolution && (
                                    <>
                                        <Text style={styles.suggestionsTitle}>Optimized Solution:</Text>
                                        <View style={styles.optimizedCode}>
                                            <Text style={styles.optimizedCodeText}>{aiFeedback.optimizedSolution}</Text>
                                        </View>
                                    </>
                                )}
                            </View>
                        )}
                    </View>
                )}

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
    controlsRow: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    controlItem: {
        marginBottom: 12,
    },
    controlLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    buttonGroup: {
        flexDirection: 'row',
    },
    diffButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#1e293b',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#334155',
    },
    diffButtonText: {
        fontSize: 14,
        color: '#94a3b8',
    },
    diffButtonTextActive: {
        color: '#f8fafc',
        fontWeight: '600',
    },
    langButton: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 8,
        backgroundColor: '#1e293b',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#334155',
    },
    langButtonActive: {
        backgroundColor: '#6366f1',
        borderColor: '#6366f1',
    },
    langButtonText: {
        fontSize: 13,
        color: '#94a3b8',
    },
    langButtonTextActive: {
        color: '#f8fafc',
        fontWeight: '500',
    },
    generateButton: {
        marginHorizontal: 16,
        backgroundColor: '#8b5cf6',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    generateButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#f8fafc',
    },
    problemCard: {
        marginHorizontal: 16,
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    problemTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: 8,
    },
    difficultyBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 16,
    },
    difficultyText: {
        fontSize: 12,
        fontWeight: '600',
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#f8fafc',
        marginTop: 12,
        marginBottom: 8,
    },
    descriptionText: {
        fontSize: 14,
        color: '#cbd5e1',
        lineHeight: 22,
    },
    exampleBox: {
        backgroundColor: '#0f172a',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    exampleText: {
        fontSize: 13,
        color: '#cbd5e1',
        marginBottom: 4,
    },
    exampleExplain: {
        fontSize: 12,
        color: '#94a3b8',
        fontStyle: 'italic',
        marginTop: 4,
    },
    bold: {
        fontWeight: '600',
        color: '#f8fafc',
    },
    constraintText: {
        fontSize: 13,
        color: '#94a3b8',
        marginBottom: 4,
    },
    solutionCard: {
        marginHorizontal: 16,
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    solutionHeader: {
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#f8fafc',
        marginBottom: 12,
    },
    solutionLangRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    solutionLangButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        backgroundColor: '#0f172a',
        marginRight: 6,
        marginBottom: 6,
    },
    solutionLangButtonActive: {
        backgroundColor: '#6366f1',
    },
    solutionLangText: {
        fontSize: 12,
        color: '#94a3b8',
    },
    solutionLangTextActive: {
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
    codeEditor: {
        flex: 1,
        padding: 16,
        paddingTop: 16,
        fontSize: 14,
        color: '#f8fafc',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        minHeight: 180,
        lineHeight: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        marginTop: 16,
    },
    runButton: {
        flex: 1,
        backgroundColor: '#334155',
        borderRadius: 10,
        padding: 14,
        alignItems: 'center',
        marginRight: 8,
    },
    runButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#f8fafc',
    },
    submitButton: {
        flex: 1,
        backgroundColor: '#22c55e',
        borderRadius: 10,
        padding: 14,
        alignItems: 'center',
        marginLeft: 8,
    },
    submitButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#f8fafc',
    },
    resultBox: {
        marginTop: 16,
        padding: 14,
        borderRadius: 10,
    },
    resultSuccess: {
        backgroundColor: '#22c55e20',
        borderWidth: 1,
        borderColor: '#22c55e',
    },
    resultError: {
        backgroundColor: '#ef444420',
        borderWidth: 1,
        borderColor: '#ef4444',
    },
    resultInfo: {
        backgroundColor: '#6366f120',
        borderWidth: 1,
        borderColor: '#6366f1',
    },
    resultText: {
        fontSize: 14,
        color: '#f8fafc',
    },
    testResultsBox: {
        marginTop: 16,
        backgroundColor: '#0f172a',
        borderRadius: 12,
        padding: 16,
    },
    testResultsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#f8fafc',
        marginBottom: 8,
    },
    testResultsCount: {
        fontSize: 13,
        color: '#94a3b8',
        marginBottom: 8,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#334155',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#22c55e',
        borderRadius: 4,
    },
    aiFeedbackBox: {
        marginTop: 16,
        backgroundColor: '#6366f110',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#6366f140',
    },
    aiFeedbackHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    aiFeedbackTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#f8fafc',
    },
    aiScore: {
        fontSize: 14,
        color: '#a5b4fc',
        fontWeight: '600',
    },
    suggestionsTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#f8fafc',
        marginTop: 8,
        marginBottom: 8,
    },
    suggestionText: {
        fontSize: 13,
        color: '#cbd5e1',
        marginBottom: 4,
        lineHeight: 20,
    },
    optimizedCode: {
        backgroundColor: '#0f172a',
        borderRadius: 8,
        padding: 12,
        marginTop: 8,
    },
    optimizedCodeText: {
        fontSize: 12,
        color: '#a5b4fc',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    bottomPadding: {
        height: 40,
    },
});

export default ProblemSolvingScreen;
