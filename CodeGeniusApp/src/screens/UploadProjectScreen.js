import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    Modal,
    FlatList,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const UploadProjectScreen = () => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Filters
    const [filterLanguage, setFilterLanguage] = useState('All');
    const [filterCategory, setFilterCategory] = useState('All');
    const [sortBy, setSortBy] = useState('recent');

    // Form state
    const [projectTitle, setProjectTitle] = useState('');
    const [description, setDescription] = useState('');
    const [language, setLanguage] = useState('');
    const [category, setCategory] = useState('');
    const [tags, setTags] = useState('');
    const [github, setGithub] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const languages = ['All', 'JavaScript', 'Python', 'Java', 'C++'];
    const categories = ['All', 'Web Development', 'Data Science', 'Mobile Apps', 'Machine Learning'];

    useEffect(() => {
        fetchProjects();
    }, [filterLanguage, filterCategory, sortBy]);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const response = await api.get('/projects', {
                params: {
                    language: filterLanguage === 'All' ? undefined : filterLanguage,
                    category: filterCategory === 'All' ? undefined : filterCategory,
                    sort: sortBy,
                },
            });
            setProjects(response.data?.projects || response.data || []);
        } catch (error) {
            console.log('Using sample projects');
            setProjects([
                { id: 1, title: 'Weather App', author: 'John Doe', description: 'A simple weather application with API integration', language: 'JavaScript', tags: ['React', 'API'], views: 245, likes: 32, createdAt: new Date().toISOString() },
                { id: 2, title: 'ML Image Classifier', author: 'Jane Smith', description: 'Deep learning model for image classification', language: 'Python', tags: ['TensorFlow', 'ML'], views: 189, likes: 45, createdAt: new Date().toISOString() },
                { id: 3, title: 'Chat Application', author: 'Bob Wilson', description: 'Real-time chat app with WebSocket', language: 'JavaScript', tags: ['Node.js', 'Socket.io'], views: 312, likes: 67, createdAt: new Date().toISOString() },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchProjects();
        setRefreshing(false);
    };

    const handleSubmit = async () => {
        if (!projectTitle.trim()) {
            Alert.alert('Error', 'Please enter a project title');
            return;
        }

        setSubmitting(true);
        try {
            const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);

            await api.post('/projects', {
                userId: user?.id,
                title: projectTitle,
                description,
                language,
                category,
                github,
                tags: tagArray,
            });

            Alert.alert('Success', 'Project uploaded successfully!');
            resetForm();
            setShowUploadModal(false);
            fetchProjects();
        } catch (error) {
            Alert.alert('Error', 'Failed to upload project. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setProjectTitle('');
        setDescription('');
        setLanguage('');
        setCategory('');
        setTags('');
        setGithub('');
    };

    const formatTimeAgo = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    };

    const renderProjectCard = ({ item }) => (
        <View style={[styles.projectCard, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
            <Text style={[styles.projectTitle, { color: theme.text }]}>{item.title}</Text>
            <Text style={[styles.projectAuthor, { color: theme.primary }]}>👤 {item.author || 'Anonymous'}</Text>
            <Text style={[styles.projectDesc, { color: theme.textSecondary }]} numberOfLines={2}>{item.description}</Text>

            <View style={styles.tagRow}>
                {item.tags?.map((tag, i) => (
                    <View key={i} style={[styles.tag, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
                        <Text style={[styles.tagText, { color: theme.textSecondary }]}>{tag}</Text>
                    </View>
                ))}
                {item.language && (
                    <View style={[styles.tag, styles.langTag]}>
                        <Text style={styles.tagText}>{item.language}</Text>
                    </View>
                )}
            </View>

            <View style={styles.statsRow}>
                <Text style={[styles.statItem, { color: theme.textMuted }]}>👁 {item.views || 0}</Text>
                <Text style={[styles.statItem, { color: theme.textMuted }]}>⭐ {item.likes || 0}</Text>
                <Text style={[styles.statItem, { color: theme.textMuted }]}>⏱ {formatTimeAgo(item.createdAt)}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.title, { color: theme.text }]}>Project Gallery</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Share and discover amazing projects</Text>
                </View>
                <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => setShowUploadModal(true)}
                >
                    <Text style={styles.uploadButtonText}>➕ Upload</Text>
                </TouchableOpacity>
            </View>

            {/* Filters */}
            <View style={styles.filterSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.filterRow}>
                        <Text style={styles.filterLabel}>Language:</Text>
                        {languages.map((lang) => (
                            <TouchableOpacity
                                key={lang}
                                style={[
                                    styles.filterChip,
                                    filterLanguage === lang && styles.filterChipActive,
                                ]}
                                onPress={() => setFilterLanguage(lang)}
                            >
                                <Text style={[
                                    styles.filterChipText,
                                    filterLanguage === lang && styles.filterChipTextActive,
                                ]}>
                                    {lang}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterSecond}>
                    <View style={styles.filterRow}>
                        <Text style={styles.filterLabel}>Category:</Text>
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                style={[
                                    styles.filterChip,
                                    filterCategory === cat && styles.filterChipActive,
                                ]}
                                onPress={() => setFilterCategory(cat)}
                            >
                                <Text style={[
                                    styles.filterChipText,
                                    filterCategory === cat && styles.filterChipTextActive,
                                ]}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>

            {/* Project List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text style={styles.loadingText}>Loading projects...</Text>
                </View>
            ) : (
                <FlatList
                    data={projects}
                    renderItem={renderProjectCard}
                    keyExtractor={(item) => item.id?.toString()}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>📁</Text>
                            <Text style={styles.emptyText}>No projects found</Text>
                            <Text style={styles.emptySubtext}>Be the first to upload a project!</Text>
                        </View>
                    }
                />
            )}

            {/* Upload Modal */}
            <Modal
                visible={showUploadModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowUploadModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>📤 Upload Project</Text>
                                <TouchableOpacity onPress={() => setShowUploadModal(false)}>
                                    <Text style={styles.closeButton}>✕</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.inputLabel}>Project Title *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter project title"
                                placeholderTextColor="#64748b"
                                value={projectTitle}
                                onChangeText={setProjectTitle}
                            />

                            <Text style={styles.inputLabel}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Describe your project..."
                                placeholderTextColor="#64748b"
                                value={description}
                                onChangeText={setDescription}
                                multiline={true}
                                numberOfLines={4}
                            />

                            <Text style={styles.inputLabel}>Programming Language</Text>
                            <View style={styles.selectRow}>
                                {['JavaScript', 'Python', 'Java', 'C++'].map((lang) => (
                                    <TouchableOpacity
                                        key={lang}
                                        style={[
                                            styles.selectOption,
                                            language === lang && styles.selectOptionActive,
                                        ]}
                                        onPress={() => setLanguage(lang)}
                                    >
                                        <Text style={[
                                            styles.selectOptionText,
                                            language === lang && styles.selectOptionTextActive,
                                        ]}>
                                            {lang}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.inputLabel}>Category</Text>
                            <View style={styles.selectRow}>
                                {['Web Development', 'Data Science', 'Mobile Apps', 'ML'].map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[
                                            styles.selectOption,
                                            category === cat && styles.selectOptionActive,
                                        ]}
                                        onPress={() => setCategory(cat)}
                                    >
                                        <Text style={[
                                            styles.selectOptionText,
                                            category === cat && styles.selectOptionTextActive,
                                        ]}>
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.inputLabel}>Tags (comma separated)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="React, TypeScript, API..."
                                placeholderTextColor="#64748b"
                                value={tags}
                                onChangeText={setTags}
                            />

                            <Text style={styles.inputLabel}>GitHub Repository</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="https://github.com/..."
                                placeholderTextColor="#64748b"
                                value={github}
                                onChangeText={setGithub}
                                autoCapitalize="none"
                            />

                            <TouchableOpacity
                                style={[styles.submitButton, submitting && styles.buttonDisabled]}
                                onPress={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="#f8fafc" />
                                ) : (
                                    <Text style={styles.submitButtonText}>🚀 Publish Project</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 16,
        paddingBottom: 12,
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
    uploadButton: {
        backgroundColor: '#6366f1',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
    },
    uploadButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#f8fafc',
    },
    filterSection: {
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    filterSecond: {
        marginTop: 8,
    },
    filterLabel: {
        fontSize: 12,
        color: '#94a3b8',
        marginRight: 8,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#1e293b',
        marginRight: 6,
        borderWidth: 1,
        borderColor: '#334155',
    },
    filterChipActive: {
        backgroundColor: '#6366f1',
        borderColor: '#6366f1',
    },
    filterChipText: {
        fontSize: 12,
        color: '#94a3b8',
    },
    filterChipTextActive: {
        color: '#f8fafc',
    },
    listContainer: {
        padding: 16,
        paddingTop: 8,
    },
    projectCard: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    projectTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#f8fafc',
        marginBottom: 4,
    },
    projectAuthor: {
        fontSize: 13,
        color: '#94a3b8',
        marginBottom: 8,
    },
    projectDesc: {
        fontSize: 14,
        color: '#cbd5e1',
        lineHeight: 20,
        marginBottom: 12,
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 12,
    },
    tag: {
        backgroundColor: '#334155',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 6,
        marginBottom: 6,
    },
    langTag: {
        backgroundColor: '#6366f120',
    },
    tagText: {
        fontSize: 11,
        color: '#a5b4fc',
    },
    statsRow: {
        flexDirection: 'row',
    },
    statItem: {
        fontSize: 12,
        color: '#64748b',
        marginRight: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 12,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 16,
        color: '#f8fafc',
        fontWeight: '500',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1e293b',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    closeButton: {
        fontSize: 24,
        color: '#94a3b8',
    },
    inputLabel: {
        fontSize: 14,
        color: '#94a3b8',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        backgroundColor: '#0f172a',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: '#f8fafc',
        borderWidth: 1,
        borderColor: '#334155',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    selectRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    selectOption: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#0f172a',
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#334155',
    },
    selectOptionActive: {
        backgroundColor: '#6366f1',
        borderColor: '#6366f1',
    },
    selectOptionText: {
        fontSize: 13,
        color: '#94a3b8',
    },
    selectOptionTextActive: {
        color: '#f8fafc',
    },
    submitButton: {
        backgroundColor: '#22c55e',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 24,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#f8fafc',
    },
});

export default UploadProjectScreen;
