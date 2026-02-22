import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ReportModal = ({ visible, onClose }) => {
    const { user } = useAuth();
    const [reportType, setReportType] = useState('bug');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const reportTypes = [
        { value: 'bug', label: '🐛 Bug Report', description: 'Something is broken or not working' },
        { value: 'feature', label: '💡 Feature Request', description: 'Suggest a new feature' },
        { value: 'problem_issue', label: '⚠️ Problem Issue', description: 'Incorrect test case or solution' },
        { value: 'other', label: '📝 Other', description: 'General feedback or question' },
    ];

    const handleSubmit = async () => {
        if (!title.trim() || !description.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);

        try {
            await api.post('/reports', {
                userId: user?.id,
                reportType,
                title: title.trim(),
                description: description.trim(),
                pageUrl: 'Mobile App', // Hardcoded for mobile
            });

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setTitle('');
                setDescription('');
                setReportType('bug');
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Report submission error:', error);
            Alert.alert('Error', 'Failed to submit report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                <View style={styles.modalContent}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>×</Text>
                    </TouchableOpacity>

                    <Text style={styles.title}>📋 Submit a Report</Text>
                    <Text style={styles.subtitle}>Help us improve CodeGenius!</Text>

                    {success ? (
                        <View style={styles.successContainer}>
                            <Text style={styles.successIcon}>✅</Text>
                            <Text style={styles.successTitle}>Report Submitted!</Text>
                            <Text style={styles.successText}>Thank you for your feedback.</Text>
                        </View>
                    ) : (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.typeGrid}>
                                {reportTypes.map((type) => (
                                    <TouchableOpacity
                                        key={type.value}
                                        style={[
                                            styles.typeOption,
                                            reportType === type.value && styles.typeOptionSelected,
                                        ]}
                                        onPress={() => setReportType(type.value)}
                                    >
                                        <Text style={styles.typeLabel}>{type.label}</Text>
                                        <Text style={styles.typeDesc}>{type.description}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Title</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Brief summary..."
                                placeholderTextColor="#94a3b8"
                                value={title}
                                onChangeText={setTitle}
                                maxLength={200}
                            />

                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Please describe in detail..."
                                placeholderTextColor="#94a3b8"
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                textAlignVertical="top"
                            />

                            <TouchableOpacity
                                style={[styles.submitButton, loading && styles.buttonDisabled]}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#ffffff" />
                                ) : (
                                    <Text style={styles.submitButtonText}>📨 Submit Report</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#334155',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 1,
    },
    closeButtonText: {
        fontSize: 28,
        color: '#94a3b8',
        lineHeight: 28,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#94a3b8',
        marginBottom: 20,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    typeOption: {
        width: '48%',
        backgroundColor: '#0f172a',
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#334155',
    },
    typeOptionSelected: {
        borderColor: '#6366f1',
        backgroundColor: '#6366f120',
    },
    typeLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#f8fafc',
        marginBottom: 4,
    },
    typeDesc: {
        fontSize: 10,
        color: '#94a3b8',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#cbd5e1',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#0f172a',
        borderRadius: 8,
        padding: 12,
        color: '#f8fafc',
        borderWidth: 1,
        borderColor: '#334155',
        marginBottom: 16,
    },
    textArea: {
        minHeight: 100,
    },
    submitButton: {
        backgroundColor: '#6366f1',
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#f8fafc',
        fontWeight: '600',
        fontSize: 16,
    },
    successContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    successIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    successTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#22c55e',
        marginBottom: 8,
    },
    successText: {
        fontSize: 14,
        color: '#94a3b8',
    },
});

export default ReportModal;
