import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const LeaderboardScreen = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('leaderboard');
    const [timeFilter, setTimeFilter] = useState('all_time');
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [topThree, setTopThree] = useState([]);
    const [userRank, setUserRank] = useState(0);
    const [badges, setBadges] = useState([]);
    const [userStats, setUserStats] = useState({ problemsSolved: 0, accuracy: 0, currentStreak: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { theme } = useTheme();

    const fetchLeaderboard = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get(`/leaderboard?period=${timeFilter}&limit=50`);
            const data = response.data;
            setLeaderboardData(data.leaderboard || []);
            setTopThree(data.topThree || data.leaderboard?.slice(0, 3) || []);

            // Get user rank
            if (user?.id) {
                try {
                    const rankResponse = await api.get(`/leaderboard/rank/${user.id}`);
                    setUserRank(rankResponse.data?.rank || 0);
                } catch (e) {
                    const idx = data.leaderboard?.findIndex(u => u.id === user.id);
                    setUserRank(idx >= 0 ? idx + 1 : 0);
                }
            }
        } catch (error) {
            console.log('Using demo leaderboard data');
            const demoData = [
                { id: 1, name: 'Sarah Johnson', initials: 'SJ', points: 15200, problemsSolved: 145, accuracy: 96, level: 'Platinum' },
                { id: 2, name: 'Michael Chen', initials: 'MC', points: 12800, problemsSolved: 120, accuracy: 92, level: 'Gold' },
                { id: 3, name: 'Emma Wilson', initials: 'EW', points: 11500, problemsSolved: 108, accuracy: 89, level: 'Gold' },
                { id: 4, name: 'James Brown', initials: 'JB', points: 9800, problemsSolved: 95, accuracy: 87, level: 'Silver' },
                { id: 5, name: 'Alex Kumar', initials: 'AK', points: 8500, problemsSolved: 82, accuracy: 84, level: 'Silver' },
            ];
            setLeaderboardData(demoData);
            setTopThree(demoData.slice(0, 3));
            setUserRank(15);
        } finally {
            setLoading(false);
        }
    }, [timeFilter, user?.id]);

    const fetchBadges = useCallback(async () => {
        try {
            if (user?.id) {
                const [badgeResponse, statsResponse] = await Promise.all([
                    api.get(`/users/badges/${user.id}`),
                    api.get(`/users/stats/${user.id}`),
                ]);

                const stats = statsResponse.data?.stats || { problemsSolved: 0, accuracy: 0, currentStreak: 0 };
                setUserStats(stats);

                const badgesWithProgress = (badgeResponse.data?.badges || []).map(badge => {
                    let progress = badge.progress || 0;
                    if (progress === 0 && !badge.isEarned) {
                        const reqValue = badge.requirementValue || 1;
                        switch (badge.requirementType) {
                            case 'problems_solved':
                                progress = Math.min(100, Math.round((stats.problemsSolved / reqValue) * 100));
                                break;
                            case 'accuracy_rate':
                                progress = Math.min(100, Math.round((stats.accuracy / reqValue) * 100));
                                break;
                            case 'streak':
                                progress = Math.min(100, Math.round((stats.currentStreak / reqValue) * 100));
                                break;
                        }
                    }
                    return { ...badge, progress: badge.isEarned ? 100 : progress };
                });
                setBadges(badgesWithProgress);
            }
        } catch (error) {
            console.log('Using demo badges');
            setUserStats({ problemsSolved: 12, accuracy: 85, currentStreak: 5 });
            setBadges([]);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    useEffect(() => {
        if (activeTab === 'badges') {
            fetchBadges();
        }
    }, [activeTab, fetchBadges]);

    const onRefresh = async () => {
        setRefreshing(true);
        if (activeTab === 'leaderboard') {
            await fetchLeaderboard();
        } else {
            await fetchBadges();
        }
        setRefreshing(false);
    };

    const getBadgeIcon = (name) => {
        const icons = {
            Bronze: '🏆', Silver: '🛡️', Gold: '👑', Platinum: '💎',
            'Problem Solver': '◉', 'Code Optimizer': '<>', 'Speed Demon': '⏱', 'Streak Master': '⭐',
        };
        return icons[name] || '🏅';
    };

    const getDefaultBadges = () => [
        { id: 1, name: 'Bronze', description: 'Solve 10 problems', color: 'bronze', requirementValue: 10, progress: Math.min(100, (userStats.problemsSolved / 10) * 100), isEarned: userStats.problemsSolved >= 10 },
        { id: 2, name: 'Silver', description: 'Solve 25 problems', color: 'silver', requirementValue: 25, progress: Math.min(100, (userStats.problemsSolved / 25) * 100), isEarned: userStats.problemsSolved >= 25 },
        { id: 3, name: 'Gold', description: 'Solve 50 problems', color: 'gold', requirementValue: 50, progress: Math.min(100, (userStats.problemsSolved / 50) * 100), isEarned: userStats.problemsSolved >= 50 },
        { id: 4, name: 'Platinum', description: 'Solve 100 problems', color: 'platinum', requirementValue: 100, progress: Math.min(100, (userStats.problemsSolved / 100) * 100), isEarned: userStats.problemsSolved >= 100 },
    ];

    const renderLeaderboardItem = ({ item, index }) => (
        <View style={[styles.leaderboardRow, item.id === user?.id && styles.currentUserRow]}>
            <View style={styles.rankCol}>
                {index < 3 ? <Text style={styles.crown}>👑</Text> : <Text style={styles.rankNumber}>#{index + 4}</Text>}
            </View>
            <View style={styles.avatarCol}>
                {item.profilePhoto ? (
                    <Image source={{ uri: item.profilePhoto }} style={styles.avatarImage} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.initials}>{item.initials || item.name?.split(' ').map(n => n[0]).join('')}</Text>
                    </View>
                )}
            </View>
            <View style={styles.userInfoCol}>
                <Text style={styles.userName}>{item.name}</Text>
                <View style={styles.levelBadge}>
                    <Text style={styles.levelText}>{item.level || 'Bronze'}</Text>
                </View>
            </View>
            <View style={styles.statsCol}>
                <Text style={styles.problemsText}>{item.problemsSolved}</Text>
                <Text style={styles.pointsText}>{item.points?.toLocaleString()}</Text>
                <Text style={styles.accuracyText}>{item.accuracy}%</Text>
            </View>
        </View>
    );

    // Render a single leaderboard row
    const renderUserRow = (item, rank) => (
        <View key={item.id || rank} style={[styles.leaderboardRow, { backgroundColor: theme.backgroundCard, borderColor: theme.border }, item.id === user?.id && styles.currentUserRow]}>
            <View style={styles.rankCol}>
                {rank <= 3 ? <Text style={styles.crown}>👑</Text> : <Text style={[styles.rankNumber, { color: theme.textSecondary }]}>#{rank}</Text>}
            </View>
            <View style={styles.avatarCol}>
                {item.profilePhoto ? (
                    <Image source={{ uri: item.profilePhoto }} style={styles.avatarImage} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.initials}>{item.initials || item.name?.split(' ').map(n => n[0]).join('')}</Text>
                    </View>
                )}
            </View>
            <View style={styles.userInfoCol}>
                <Text style={[styles.userName, { color: theme.text }]}>{item.name || item.fullName}</Text>
                <View style={styles.levelBadge}>
                    <Text style={styles.levelText}>{item.level || 'Bronze'}</Text>
                </View>
            </View>
            <View style={styles.statsCol}>
                <Text style={[styles.problemsText, { color: theme.textSecondary }]}>{item.problemsSolved || 0}</Text>
                <Text style={[styles.pointsText, { color: theme.text }]}>{(item.points || 0).toLocaleString()}</Text>
                <Text style={[styles.accuracyText, { color: theme.success }]}>{item.accuracy || 0}%</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={[styles.title, { color: theme.text }]}>Leaderboard & Badges</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Compete with developers and earn achievements.</Text>
                </View>
                <View style={styles.rankIndicator}>
                    <Text style={styles.rankLabel}>🏅</Text>
                    <Text style={styles.rankValue}>#{userRank || '-'}</Text>
                </View>
            </View>

            {/* Tabs */}
            <View style={[styles.tabs, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
                <TouchableOpacity
                    style={[styles.tab, { backgroundColor: theme.inputBackground }, activeTab === 'leaderboard' && styles.tabActive]}
                    onPress={() => setActiveTab('leaderboard')}
                >
                    <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === 'leaderboard' && styles.tabTextActive]}>
                        Leaderboard
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, { backgroundColor: theme.inputBackground }, activeTab === 'badges' && styles.tabActive]}
                    onPress={() => setActiveTab('badges')}
                >
                    <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === 'badges' && styles.tabTextActive]}>
                        My Badges
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {activeTab === 'leaderboard' ? (
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
                >
                    {/* Top Performers */}
                    {topThree.length > 0 && (
                        <View style={[styles.topPerformersBox, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
                            <Text style={[styles.topTitle, { color: theme.text }]}>🏆 Top Performers</Text>
                            <Text style={[styles.topSubtitle, { color: theme.textSecondary }]}>
                                The highest-ranking developers {timeFilter === 'this_month' ? 'this month' : 'of all time'}
                            </Text>
                            <View style={styles.topRow}>
                                {/* 2nd Place */}
                                {topThree[1] && (
                                    <View style={[styles.topCard, styles.secondPlace]}>
                                        {topThree[1].profilePhoto ? (
                                            <Image source={{ uri: topThree[1].profilePhoto }} style={styles.topAvatarImage} />
                                        ) : (
                                            <View style={styles.topAvatar}>
                                                <Text style={styles.topInitials}>{topThree[1].initials || topThree[1].name?.charAt(0)}</Text>
                                            </View>
                                        )}
                                        <Text style={styles.topName} numberOfLines={1}>{topThree[1].name}</Text>
                                        <Text style={styles.topPoints}>{(topThree[1].points || 0).toLocaleString()} pts</Text>
                                        <View style={styles.placeIndicator}><Text style={styles.placeText}>2</Text></View>
                                    </View>
                                )}
                                {/* 1st Place */}
                                {topThree[0] && (
                                    <View style={[styles.topCard, styles.firstPlace]}>
                                        {topThree[0].profilePhoto ? (
                                            <Image source={{ uri: topThree[0].profilePhoto }} style={[styles.topAvatarImage, styles.firstAvatarImage]} />
                                        ) : (
                                            <View style={[styles.topAvatar, styles.firstAvatar]}>
                                                <Text style={styles.topInitials}>{topThree[0].initials || topThree[0].name?.charAt(0)}</Text>
                                            </View>
                                        )}
                                        <Text style={styles.topName} numberOfLines={1}>{topThree[0].name}</Text>
                                        <Text style={styles.topPoints}>{(topThree[0].points || 0).toLocaleString()} pts</Text>
                                        <View style={[styles.placeIndicator, styles.firstIndicator]}><Text style={styles.placeText}>1</Text></View>
                                    </View>
                                )}
                                {/* 3rd Place */}
                                {topThree[2] && (
                                    <View style={[styles.topCard, styles.thirdPlace]}>
                                        {topThree[2].profilePhoto ? (
                                            <Image source={{ uri: topThree[2].profilePhoto }} style={styles.topAvatarImage} />
                                        ) : (
                                            <View style={styles.topAvatar}>
                                                <Text style={styles.topInitials}>{topThree[2].initials || topThree[2].name?.charAt(0)}</Text>
                                            </View>
                                        )}
                                        <Text style={styles.topName} numberOfLines={1}>{topThree[2].name}</Text>
                                        <Text style={styles.topPoints}>{(topThree[2].points || 0).toLocaleString()} pts</Text>
                                        <View style={styles.placeIndicator}><Text style={styles.placeText}>3</Text></View>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Time Filters */}
                    <View style={styles.filterRow}>
                        <Text style={styles.globalTitle}>All Rankings</Text>
                        <View style={styles.filterButtons}>
                            <TouchableOpacity
                                style={[styles.filterBtn, timeFilter === 'all_time' && styles.filterBtnActive]}
                                onPress={() => setTimeFilter('all_time')}
                            >
                                <Text style={[styles.filterBtnText, timeFilter === 'all_time' && styles.filterBtnTextActive]}>All Time</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filterBtn, timeFilter === 'this_month' && styles.filterBtnActive]}
                                onPress={() => setTimeFilter('this_month')}
                            >
                                <Text style={[styles.filterBtnText, timeFilter === 'this_month' && styles.filterBtnTextActive]}>This Month</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Table Header */}
                    <View style={styles.tableHeader}>
                        <Text style={styles.headerRank}>#</Text>
                        <Text style={styles.headerUser}>User</Text>
                        <Text style={styles.headerProblems}>Solved</Text>
                        <Text style={styles.headerPoints}>Points</Text>
                        <Text style={styles.headerAccuracy}>Acc</Text>
                    </View>

                    {/* Leaderboard List - Show ALL users */}
                    {loading ? (
                        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 32 }} />
                    ) : leaderboardData.length > 0 ? (
                        leaderboardData.map((item, index) => renderUserRow(item, index + 1))
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No rankings yet. Be the first to solve problems!</Text>
                        </View>
                    )}
                    <View style={styles.bottomPadding} />
                </ScrollView>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
                >
                    <View style={styles.badgesHeader}>
                        <Text style={styles.badgesTitle}>🏅 Your Achievements</Text>
                        <Text style={styles.badgesSubtitle}>Unlock badges by solving problems and improving your skills</Text>
                    </View>

                    <View style={styles.badgeGrid}>
                        {(badges.length > 0 ? badges : getDefaultBadges()).map((badge) => (
                            <View key={badge.id} style={[styles.badgeCard, badge.isEarned && styles.badgeEarned]}>
                                <View style={[styles.badgeIconContainer, badge.isEarned && styles.badgeIconEarned]}>
                                    <Text style={styles.badgeIconText}>{getBadgeIcon(badge.name)}</Text>
                                </View>
                                <Text style={styles.badgeName}>{badge.name}</Text>
                                <Text style={styles.badgeDesc}>{badge.description}</Text>
                                {badge.isEarned ? (
                                    <Text style={styles.earnedTag}>✔ Earned</Text>
                                ) : (
                                    <>
                                        <View style={styles.progressBar}>
                                            <View style={[styles.progressFill, { width: `${badge.progress}%` }]} />
                                        </View>
                                        <Text style={styles.progressText}>{Math.round(badge.progress)}% complete</Text>
                                    </>
                                )}
                            </View>
                        ))}
                    </View>
                    <View style={styles.bottomPadding} />
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    scrollView: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16, paddingBottom: 8 },
    headerLeft: { flex: 1, marginRight: 12 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#f8fafc' },
    subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
    rankIndicator: { backgroundColor: '#1e293b', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, alignItems: 'center', minWidth: 60 },
    rankLabel: { fontSize: 16 },
    rankValue: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc', marginTop: 2 },
    tabs: { flexDirection: 'row', marginHorizontal: 16, backgroundColor: '#1e293b', borderRadius: 12, padding: 4, marginBottom: 16 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: '#6366f1' },
    tabText: { fontSize: 14, color: '#94a3b8' },
    tabTextActive: { color: '#f8fafc', fontWeight: '600' },
    topPerformersBox: { marginHorizontal: 16, backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
    topTitle: { fontSize: 16, fontWeight: '600', color: '#f8fafc' },
    topSubtitle: { fontSize: 12, color: '#94a3b8', marginBottom: 16 },
    topRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end' },
    topCard: { alignItems: 'center', marginHorizontal: 8, width: 90 },
    secondPlace: { marginTop: 20 },
    thirdPlace: { marginTop: 30 },
    firstPlace: { marginBottom: 10 },
    topAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    topAvatarImage: { width: 50, height: 50, borderRadius: 25, marginBottom: 8 },
    firstAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fbbf24' },
    firstAvatarImage: { width: 60, height: 60, borderRadius: 30 },
    topInitials: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc' },
    topName: { fontSize: 12, color: '#f8fafc', fontWeight: '500', textAlign: 'center' },
    topPoints: { fontSize: 11, color: '#94a3b8' },
    placeIndicator: { position: 'absolute', top: -8, right: -4, width: 24, height: 24, borderRadius: 12, backgroundColor: '#64748b', justifyContent: 'center', alignItems: 'center' },
    firstIndicator: { backgroundColor: '#fbbf24' },
    placeText: { fontSize: 12, fontWeight: 'bold', color: '#f8fafc' },
    filterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
    globalTitle: { fontSize: 16, fontWeight: '600', color: '#f8fafc' },
    filterButtons: { flexDirection: 'row' },
    filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#1e293b', marginLeft: 8 },
    filterBtnActive: { backgroundColor: '#6366f1' },
    filterBtnText: { fontSize: 12, color: '#94a3b8' },
    filterBtnTextActive: { color: '#f8fafc' },
    tableHeader: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#1e293b', marginHorizontal: 16, borderRadius: 8, marginBottom: 8 },
    headerRank: { width: 30, fontSize: 11, color: '#64748b', fontWeight: '600' },
    headerUser: { flex: 1, fontSize: 11, color: '#64748b', fontWeight: '600' },
    headerProblems: { width: 50, fontSize: 11, color: '#64748b', textAlign: 'center', fontWeight: '600' },
    headerPoints: { width: 60, fontSize: 11, color: '#64748b', textAlign: 'center', fontWeight: '600' },
    headerAccuracy: { width: 40, fontSize: 11, color: '#64748b', textAlign: 'right', fontWeight: '600' },
    leaderboardRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, marginHorizontal: 16, backgroundColor: '#1e293b', borderRadius: 10, marginBottom: 6 },
    currentUserRow: { borderWidth: 1, borderColor: '#6366f1' },
    rankCol: { width: 30 },
    crown: { fontSize: 16 },
    rankNumber: { fontSize: 12, color: '#64748b' },
    avatarCol: { width: 36, height: 36, marginRight: 10 },
    avatarImage: { width: 36, height: 36, borderRadius: 18 },
    avatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
    initials: { fontSize: 14, fontWeight: 'bold', color: '#f8fafc' },
    userInfoCol: { flex: 1 },
    userName: { fontSize: 14, fontWeight: '500', color: '#f8fafc' },
    levelBadge: { backgroundColor: '#6366f120', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginTop: 4 },
    levelText: { fontSize: 10, color: '#a5b4fc' },
    statsCol: { flexDirection: 'row', alignItems: 'center' },
    problemsText: { width: 50, fontSize: 12, color: '#94a3b8', textAlign: 'center' },
    pointsText: { width: 60, fontSize: 12, color: '#f8fafc', fontWeight: '600', textAlign: 'center' },
    accuracyText: { width: 40, fontSize: 12, color: '#22c55e', textAlign: 'right' },
    badgesHeader: { paddingHorizontal: 16, marginBottom: 16 },
    badgesTitle: { fontSize: 18, fontWeight: '600', color: '#f8fafc' },
    badgesSubtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
    badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
    badgeCard: { width: '46%', backgroundColor: '#1e293b', borderRadius: 16, padding: 16, margin: '2%', borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
    badgeEarned: { borderColor: '#22c55e' },
    badgeIconContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    badgeIconEarned: { backgroundColor: '#22c55e20' },
    badgeIconText: { fontSize: 24 },
    badgeName: { fontSize: 14, fontWeight: '600', color: '#f8fafc', textAlign: 'center' },
    badgeDesc: { fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 4 },
    earnedTag: { fontSize: 12, color: '#22c55e', fontWeight: '500', marginTop: 12 },
    progressBar: { width: '100%', height: 6, backgroundColor: '#334155', borderRadius: 3, marginTop: 12 },
    progressFill: { height: '100%', backgroundColor: '#6366f1', borderRadius: 3 },
    progressText: { fontSize: 10, color: '#64748b', marginTop: 4 },
    emptyState: { backgroundColor: '#1e293b', marginHorizontal: 16, borderRadius: 12, padding: 32, alignItems: 'center' },
    emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
    bottomPadding: { height: 24 },
});

export default LeaderboardScreen;
