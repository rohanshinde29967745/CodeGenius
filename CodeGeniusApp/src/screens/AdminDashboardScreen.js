import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { adminAPI } from '../services/api';

const AdminDashboardScreen = () => {
    const { user, logout } = useAuth();
    const { theme, isDark, toggleTheme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [exporting, setExporting] = useState(false);

    const [stats, setStats] = useState({
        totalUsers: 0,
        dailySubmissions: 0,
        activeProblems: 0,
        totalProjects: 0,
        growth: { users: 0, submissions: 0 },
    });
    const [activities, setActivities] = useState([]);
    const [popularProblems, setPopularProblems] = useState([]);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            setLoading(true);
            const [statsRes, activityRes, problemsRes] = await Promise.all([
                adminAPI.getStats(),
                adminAPI.getActivity(5),
                adminAPI.getPopularProblems(3),
            ]);

            setStats(statsRes.data || {
                totalUsers: 0,
                dailySubmissions: 0,
                activeProblems: 0,
                totalProjects: 0,
                growth: { users: 0, submissions: 0 },
            });
            setActivities(activityRes.data?.activities || []);
            setPopularProblems(problemsRes.data?.problems || []);
        } catch (error) {
            console.error('Failed to fetch admin data:', error);
            Alert.alert('Error', 'Failed to load admin data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAdminData();
        setRefreshing(false);
    };

    const handleExportData = async () => {
        try {
            setExporting(true);
            const response = await adminAPI.exportData();
            const data = response.data;

            let csv = "=== CODEGENIUS PLATFORM EXPORT ===\n\n";

            csv += "--- USERS ---\n";
            csv += "ID,Name,Email,Role,Level,Points,Problems Solved,Created At\n";
            data.users?.forEach(u => {
                csv += `${u.id},"${u.fullName}",${u.email},${u.role},${u.level},${u.points},${u.problemsSolved},${u.createdAt}\n`;
            });

            csv += "\n--- RECENT SUBMISSIONS ---\n";
            csv += "ID,User,Problem,Status,Points,Submitted At\n";
            data.submissions?.forEach(s => {
                csv += `${s.id},"${s.userName}","${s.problemTitle}",${s.status},${s.points},${s.submittedAt}\n`;
            });

            csv += "\n--- RECENT ACTIVITY ---\n";
            csv += "ID,User,Type,Description,Time\n";
            data.activities?.forEach(a => {
                csv += `${a.id},"${a.userName}",${a.type},"${a.description}",${a.time}\n`;
            });

            const fileName = `codegenius_export_${new Date().toISOString().split('T')[0]}.csv`;
            const filePath = `${FileSystem.documentDirectory}${fileName}`;

            await FileSystem.writeAsStringAsync(filePath, csv, { encoding: FileSystem.EncodingType.UTF8 });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(filePath);
            } else {
                Alert.alert('Success', `Data exported to: ${fileName}`);
            }
        } catch (error) {
            console.error('Export error:', error);
            Alert.alert('Error', 'Failed to export data');
        } finally {
            setExporting(false);
        }
    };

    const formatTimeAgo = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${Math.floor(diffMs / 86400000)}d ago`;
    };

    const getActivityIcon = (type) => {
        const icons = {
            registration: "📧",
            login: "🔵",
            problem_solved: "🧩",
            project_uploaded: "📦",
            badge_earned: "🏅",
        };
        return icons[type] || "🔵";
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout },
        ]);
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading admin data...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.title, { color: theme.text }]}>Admin Dashboard</Text>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Platform analytics and management</Text>
                    </View>
                    <View style={styles.adminBadge}>
                        <Text style={styles.adminBadgeText}>👤 {user?.fullName || 'Admin'}</Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.exportBtn]}
                        onPress={handleExportData}
                        disabled={exporting}
                    >
                        {exporting ? (
                            <ActivityIndicator size="small" color="#f8fafc" />
                        ) : (
                            <Text style={styles.actionBtnText}>📤 Export Data</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.settingsBtn]} onPress={toggleTheme}>
                        <Text style={styles.actionBtnText}>{isDark ? '☀️ Light' : '🌙 Dark'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.logoutBtn]} onPress={handleLogout}>
                        <Text style={styles.logoutBtnText}>🚪 Logout</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Users</Text>
                        <Text style={[styles.statValue, { color: theme.text }]}>{stats.totalUsers?.toLocaleString() || 0}</Text>
                        <Text style={[styles.statGrowth, { color: stats.growth?.users >= 0 ? '#22c55e' : '#ef4444' }]}>
                            {stats.growth?.users >= 0 ? '+' : ''}{stats.growth?.users || 0}% from yesterday
                        </Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Daily Submissions</Text>
                        <Text style={[styles.statValue, { color: theme.text }]}>{stats.dailySubmissions?.toLocaleString() || 0}</Text>
                        <Text style={[styles.statGrowth, { color: stats.growth?.submissions >= 0 ? '#22c55e' : '#ef4444' }]}>
                            {stats.growth?.submissions >= 0 ? '+' : ''}{stats.growth?.submissions || 0}% from yesterday
                        </Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Active Problems</Text>
                        <Text style={[styles.statValue, { color: theme.text }]}>{stats.activeProblems || 0}</Text>
                        <Text style={[styles.statGrowth, { color: '#22c55e' }]}>Available challenges</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Project Uploads</Text>
                        <Text style={[styles.statValue, { color: theme.text }]}>{stats.totalProjects?.toLocaleString() || 0}</Text>
                        <Text style={[styles.statGrowth, { color: '#22c55e' }]}>Total projects</Text>
                    </View>
                </View>

                {/* Recent Activity */}
                <View style={[styles.section, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>🔵 Recent Activity</Text>
                    <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Latest platform events</Text>

                    {activities.length > 0 ? (
                        activities.map((activity, index) => (
                            <View key={activity.id || index} style={[styles.activityItem, { borderBottomColor: theme.border }]}>
                                <View style={styles.activityLeft}>
                                    <Text style={styles.activityIcon}>{getActivityIcon(activity.type)}</Text>
                                    <Text style={[styles.activityText, { color: theme.text }]} numberOfLines={1}>
                                        {activity.description || `${activity.userName}: ${activity.type?.replace(/_/g, " ")}`}
                                    </Text>
                                </View>
                                <Text style={[styles.activityTime, { color: theme.textMuted }]}>{formatTimeAgo(activity.time)}</Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No recent activity</Text>
                        </View>
                    )}
                </View>

                {/* Popular Problems */}
                <View style={[styles.section, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>🔥 Most Popular Problems</Text>
                    <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Highest engagement</Text>

                    {popularProblems.length > 0 ? (
                        popularProblems.map((problem, index) => (
                            <View key={problem.id || index} style={styles.problemItem}>
                                <View style={styles.problemHeader}>
                                    <Text style={[styles.problemTitle, { color: theme.text }]}>{problem.title}</Text>
                                    <Text style={[styles.problemAttempts, { color: theme.textSecondary }]}>{problem.attempts} attempts</Text>
                                </View>
                                <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                                    <View style={[styles.progressFill, { width: `${problem.successRate || 0}%` }]} />
                                </View>
                                <Text style={[styles.successRate, { color: theme.textMuted }]}>Success Rate: {problem.successRate || 0}%</Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No problems yet</Text>
                        </View>
                    )}
                </View>

                <View style={styles.bottomPadding} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { fontSize: 14, marginTop: 12 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 16, paddingTop: 16, marginBottom: 16 },
    title: { fontSize: 24, fontWeight: 'bold' },
    subtitle: { fontSize: 14, marginTop: 4 },
    adminBadge: { backgroundColor: '#6366f1', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    adminBadgeText: { fontSize: 12, fontWeight: '600', color: '#f8fafc' },
    actionRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, gap: 8 },
    actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    exportBtn: { backgroundColor: '#6366f1' },
    settingsBtn: { backgroundColor: '#334155' },
    logoutBtn: { backgroundColor: '#ef444420', borderWidth: 1, borderColor: '#ef4444' },
    actionBtnText: { fontSize: 13, fontWeight: '600', color: '#f8fafc' },
    logoutBtnText: { fontSize: 13, fontWeight: '600', color: '#ef4444' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginBottom: 16 },
    statCard: { width: '47%', margin: '1.5%', borderRadius: 12, padding: 16, borderWidth: 1 },
    statLabel: { fontSize: 12, marginBottom: 4 },
    statValue: { fontSize: 28, fontWeight: 'bold' },
    statGrowth: { fontSize: 11, marginTop: 4 },
    section: { marginHorizontal: 16, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1 },
    sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    sectionSubtitle: { fontSize: 12, marginBottom: 16 },
    activityItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
    activityLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    activityIcon: { fontSize: 16, marginRight: 10 },
    activityText: { fontSize: 13, flex: 1 },
    activityTime: { fontSize: 11 },
    problemItem: { marginBottom: 16 },
    problemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    problemTitle: { fontSize: 14, fontWeight: '500' },
    problemAttempts: { fontSize: 12 },
    progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#6366f1', borderRadius: 4 },
    successRate: { fontSize: 11, marginTop: 4 },
    emptyState: { paddingVertical: 24, alignItems: 'center' },
    emptyText: { fontSize: 14 },
    bottomPadding: { height: 24 },
});

export default AdminDashboardScreen;
