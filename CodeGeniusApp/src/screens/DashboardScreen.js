import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AnimatedBorder from '../components/AnimatedBorder';
import api from '../services/api';
import ReportModal from '../components/ReportModal';

const DashboardScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { theme } = useTheme();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [stats, setStats] = useState({
        problemsSolved: 0,
        totalPoints: 0,
        accuracy: 0,
        currentLevel: 'Bronze',
        currentXp: 0,
        xpToNextLevel: 1000,
    });
    const [activities, setActivities] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch user stats
            const statsResponse = await api.get(`/users/stats/${user?.id}`);
            if (statsResponse.data?.stats) {
                setStats(statsResponse.data.stats);
            }

            // Fetch activity
            const activityResponse = await api.get(`/users/activity/${user?.id}?limit=5`);
            if (activityResponse.data?.activities) {
                setActivities(activityResponse.data.activities);
            }
        } catch (error) {
            console.log('Using demo dashboard data');
            // Demo data fallback
            setStats({
                problemsSolved: 12,
                totalPoints: 1250,
                accuracy: 85,
                currentLevel: 'Silver',
                currentXp: 450,
                xpToNextLevel: 1000,
            });
            setActivities([
                { id: 1, type: 'problem_solved', description: 'Solved Two Sum problem', time: new Date().toISOString() },
                { id: 2, type: 'code_analyzed', description: 'Analyzed Python script', time: new Date(Date.now() - 3600000).toISOString() },
                { id: 3, type: 'login', description: 'Logged in', time: new Date(Date.now() - 86400000).toISOString() },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchDashboardData();
        setRefreshing(false);
    };

    const formatTimeAgo = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    const getActivityIcon = (type) => {
        const icons = {
            login: '🔵',
            registration: '🟢',
            problem_solved: '✅',
            problem_attempted: '🔄',
            code_analyzed: '🔍',
            code_converted: '🔄',
            project_uploaded: '📦',
            badge_earned: '🏅',
            level_up: '⭐',
        };
        return icons[type] || '◉';
    };

    const quickActions = [
        { key: 'analyzer', icon: '🔍', title: 'Analyze Code', subtitle: 'Get AI insights', screen: 'Tools' },
        { key: 'problems', icon: '💡', title: 'Solve Problems', subtitle: 'Practice coding', screen: 'ProblemSolving' },
        { key: 'upload', icon: '📁', title: 'Upload Project', subtitle: 'Share your work', screen: 'Upload' },
        { key: 'report', icon: '📢', title: 'Report Issue', subtitle: 'Found a bug?', isModal: true },
    ];

    const getBadges = () => {
        const badges = [];
        if (stats.currentLevel === 'Bronze' || stats.currentLevel === 'Silver' || stats.currentLevel === 'Gold' || stats.currentLevel === 'Platinum') {
            badges.push({ icon: '🥉', name: 'Bronze' });
        }
        if (stats.currentLevel === 'Silver' || stats.currentLevel === 'Gold' || stats.currentLevel === 'Platinum') {
            badges.push({ icon: '🥈', name: 'Silver' });
        }
        if (stats.currentLevel === 'Gold' || stats.currentLevel === 'Platinum') {
            badges.push({ icon: '🥇', name: 'Gold' });
        }
        if (stats.currentLevel === 'Platinum') {
            badges.push({ icon: '💎', name: 'Platinum' });
        }
        if (stats.accuracy >= 90) {
            badges.push({ icon: '🎯', name: 'Accuracy Master' });
        }
        return badges.length > 0 ? badges : [{ icon: '🥉', name: 'Bronze' }];
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text style={styles.loadingText}>Loading dashboard...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.greeting, { color: theme.text }]}>Welcome back, {user?.fullName?.split(' ')[0] || 'Coder'}! 👋</Text>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Here's what's happening with your coding journey today.</Text>
                    </View>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <AnimatedBorder style={[styles.statCard, {
                        backgroundColor: theme.backgroundCard,
                        borderColor: theme.border,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.08,
                        shadowRadius: 8,
                        elevation: 3,
                    }]}>
                        <View style={styles.statHeader}>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Problems Solved</Text>
                            <Text style={styles.statIconSmall}>🎯</Text>
                        </View>
                        <Text style={[styles.statValue, { color: theme.text }]}>{stats.problemsSolved}</Text>
                        <Text style={[styles.statSubtext, { color: theme.textMuted }]}>Keep solving!</Text>
                    </AnimatedBorder>

                    <AnimatedBorder style={[styles.statCard, {
                        backgroundColor: theme.backgroundCard,
                        borderColor: theme.border,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.08,
                        shadowRadius: 8,
                        elevation: 3,
                    }]}>
                        <View style={styles.statHeader}>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Points</Text>
                            <Text style={styles.statIconSmall}>📈</Text>
                        </View>
                        <Text style={[styles.statValue, { color: theme.text }]}>{stats.totalPoints?.toLocaleString()}</Text>
                        <Text style={[styles.statSubtext, { color: theme.textMuted }]}>Great progress!</Text>
                    </AnimatedBorder>

                    <AnimatedBorder style={[styles.statCard, {
                        backgroundColor: theme.backgroundCard,
                        borderColor: theme.border,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.08,
                        shadowRadius: 8,
                        elevation: 3,
                    }]}>
                        <View style={styles.statHeader}>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Accuracy</Text>
                            <Text style={styles.statIconSmall}>✓</Text>
                        </View>
                        <Text style={[styles.statValue, { color: theme.text }]}>{stats.accuracy}%</Text>
                        <Text style={[styles.statSubtext, { color: theme.textMuted }]}>Keep it up!</Text>
                    </AnimatedBorder>

                    <AnimatedBorder style={[styles.statCard, {
                        backgroundColor: theme.backgroundCard,
                        borderColor: theme.border,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.08,
                        shadowRadius: 8,
                        elevation: 3,
                    }]}>
                        <View style={styles.statHeader}>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Current Level</Text>
                            <Text style={styles.statIconSmall}>👤</Text>
                        </View>
                        <Text style={[styles.statValue, { color: theme.primary }]}>{stats.currentLevel}</Text>
                        <View style={[styles.levelBar, { backgroundColor: theme.border }]}>
                            <View style={[styles.levelProgress, { width: `${(stats.currentXp / stats.xpToNextLevel) * 100}%` }]} />
                        </View>
                        <Text style={[styles.xpText, { color: theme.textMuted }]}>{stats.currentXp}/{stats.xpToNextLevel} XP</Text>
                    </AnimatedBorder>
                </View>

                {/* Middle Section */}
                <View style={styles.middleSection}>
                    {/* Quick Actions */}
                    <AnimatedBorder style={[styles.sectionCard, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
                        <View style={[styles.sectionHeader, { borderBottomColor: theme.border }]}>
                            <Text style={styles.sectionIcon}>⚡</Text>
                            <View>
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
                                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Jump into your favorite activities</Text>
                            </View>
                        </View>
                        {quickActions.map((action) => (
                            <TouchableOpacity
                                key={action.key}
                                style={[styles.actionCard, { backgroundColor: theme.inputBackground }]}
                                onPress={() => {
                                    if (action.isModal) {
                                        setReportModalVisible(true);
                                    } else {
                                        navigation.navigate(action.screen);
                                    }
                                }}
                            >
                                <View style={styles.actionIcon}>
                                    <Text style={styles.actionIconText}>{action.icon}</Text>
                                </View>
                                <View style={styles.actionContent}>
                                    <Text style={[styles.actionTitle, { color: theme.text }]}>{action.title}</Text>
                                    <Text style={[styles.actionSubtitle, { color: theme.textSecondary }]}>{action.subtitle}</Text>
                                </View>
                                <Text style={[styles.actionArrow, { color: theme.textMuted }]}>→</Text>
                            </TouchableOpacity>
                        ))}
                    </AnimatedBorder>

                    {/* Recent Activity */}
                    <View style={[styles.sectionCard, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
                        <View style={[styles.sectionHeader, { borderBottomColor: theme.border }]}>
                            <Text style={styles.sectionIcon}>📊</Text>
                            <View>
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
                                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Your latest coding activities</Text>
                            </View>
                        </View>
                        {activities.length > 0 ? (
                            activities.map((activity) => (
                                <View key={activity.id} style={[styles.activityItem, { borderBottomColor: theme.border }]}>
                                    <Text style={styles.activityDot}>{getActivityIcon(activity.type)}</Text>
                                    <View style={styles.activityContent}>
                                        <Text style={[styles.activityType, { color: theme.text }]}>
                                            {activity.type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </Text>
                                        <Text style={[styles.activityDesc, { color: theme.textSecondary }]}>{activity.description}</Text>
                                        <Text style={[styles.activityTime, { color: theme.textMuted }]}>⏱ {formatTimeAgo(activity.time)}</Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View style={[styles.activityItem, { borderBottomColor: theme.border }]}>
                                <Text style={styles.activityDot}>◉</Text>
                                <View style={styles.activityContent}>
                                    <Text style={[styles.activityType, { color: theme.text }]}>Welcome to CodeGenius!</Text>
                                    <Text style={[styles.activityDesc, { color: theme.textSecondary }]}>Start solving problems to see your activity</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Badges Section */}
                <View style={[styles.badgesSection, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
                    <Text style={[styles.badgesTitle, { color: theme.text }]}>Your Badges</Text>
                    <Text style={[styles.badgesSubtitle, { color: theme.textSecondary }]}>Achievements you've earned on your coding journey</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.badgeRow}>
                            {getBadges().map((badge, i) => (
                                <View key={i} style={[styles.badgeItem, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
                                    <Text style={styles.badgeIcon}>{badge.icon}</Text>
                                    <Text style={[styles.badgeName, { color: theme.text }]}>{badge.name}</Text>
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                </View>

                {/* Today's Challenge */}
                <View style={[styles.challengeCard, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
                    <Text style={[styles.challengeHeader, { color: theme.text }]}>📅 Today's Challenge</Text>
                    <Text style={[styles.challengeSubtext, { color: theme.textSecondary }]}>Complete today's challenge to earn bonus points!</Text>
                    <View style={[styles.challengeBox, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
                        <View style={styles.challengeInfo}>
                            <Text style={[styles.challengeTitle, { color: theme.text }]}>Solve a New Problem</Text>
                            <Text style={[styles.challengeReward, { color: theme.textSecondary }]}>Difficulty: Easy • Reward: 50 points</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.challengeButton}
                            onPress={() => navigation.navigate('ProblemSolving')}
                        >
                            <Text style={styles.challengeButtonText}>Start Challenge</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.bottomPadding} />
            </ScrollView>
            <ReportModal
                visible={reportModalVisible}
                onClose={() => setReportModalVisible(false)}
            />
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
    header: {
        padding: 16,
        paddingBottom: 8,
    },
    greeting: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#94a3b8',
        lineHeight: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 12,
        justifyContent: 'space-between',
    },
    statCard: {
        width: '48%',
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#94a3b8',
    },
    statIconSmall: {
        fontSize: 16,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: 4,
    },
    statSubtext: {
        fontSize: 11,
        color: '#64748b',
    },
    levelBar: {
        height: 6,
        backgroundColor: '#334155',
        borderRadius: 3,
        marginTop: 8,
        marginBottom: 4,
    },
    levelProgress: {
        height: '100%',
        backgroundColor: '#6366f1',
        borderRadius: 3,
    },
    xpText: {
        fontSize: 10,
        color: '#64748b',
    },
    middleSection: {
        paddingHorizontal: 16,
    },
    sectionCard: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#f8fafc',
    },
    sectionSubtitle: {
        fontSize: 12,
        color: '#94a3b8',
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    actionIconText: {
        fontSize: 18,
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#f8fafc',
    },
    actionSubtitle: {
        fontSize: 12,
        color: '#94a3b8',
    },
    actionArrow: {
        fontSize: 18,
        color: '#64748b',
    },
    activityItem: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    activityDot: {
        fontSize: 16,
        marginRight: 12,
        marginTop: 2,
    },
    activityContent: {
        flex: 1,
    },
    activityType: {
        fontSize: 13,
        fontWeight: '500',
        color: '#f8fafc',
    },
    activityDesc: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 2,
    },
    activityTime: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 4,
    },
    badgesSection: {
        marginHorizontal: 16,
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    badgesTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#f8fafc',
        marginBottom: 4,
    },
    badgesSubtitle: {
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 16,
    },
    badgeRow: {
        flexDirection: 'row',
    },
    badgeItem: {
        backgroundColor: '#0f172a',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#334155',
    },
    badgeIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    badgeName: {
        fontSize: 13,
        color: '#f8fafc',
        fontWeight: '500',
    },
    challengeCard: {
        marginHorizontal: 16,
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    challengeHeader: {
        fontSize: 16,
        fontWeight: '600',
        color: '#f8fafc',
        marginBottom: 4,
    },
    challengeSubtext: {
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 16,
    },
    challengeBox: {
        backgroundColor: '#0f172a',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    challengeInfo: {
        flex: 1,
    },
    challengeTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#f8fafc',
    },
    challengeReward: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 4,
    },
    challengeButton: {
        backgroundColor: '#22c55e',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
    },
    challengeButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#f8fafc',
    },
    bottomPadding: {
        height: 24,
    },
});

export default DashboardScreen;
