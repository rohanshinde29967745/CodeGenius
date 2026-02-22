import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Switch,
    Alert,
    ActivityIndicator,
    RefreshControl,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import ReportModal from '../components/ReportModal';

const ProfileScreen = ({ navigation }) => {
    const { user, logout } = useAuth();
    const { isDark, toggleTheme, theme } = useTheme();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [reportModalVisible, setReportModalVisible] = useState(false);

    // Profile data
    const [profileData, setProfileData] = useState({
        fullName: user?.fullName || '',
        email: user?.email || '',
        bio: '',
        location: '',
        github: '',
        linkedin: '',
    });
    const [profilePhoto, setProfilePhoto] = useState('');

    // Stats
    const [stats, setStats] = useState({
        problemsSolved: 0,
        accuracy: 0,
        currentLevel: 'Bronze',
        currentXp: 0,
        xpToNextLevel: 1000,
        totalPoints: 0,
        currentStreak: 0,
    });

    // Projects
    const [userProjects, setUserProjects] = useState([]);
    const [expandedCategory, setExpandedCategory] = useState(null);

    // Badges
    const [badges, setBadges] = useState([]);

    // Skills
    const [skills, setSkills] = useState([]);

    // Settings
    // const [darkMode, setDarkMode] = useState(true); // Replaced by context
    const [notifications, setNotifications] = useState(true);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        setLoading(true);
        try {
            if (user?.id) {
                // Fetch profile
                const profileResponse = await api.get(`/auth/profile/${user.id}`);
                if (profileResponse.data?.user) {
                    const u = profileResponse.data.user;
                    setProfileData({
                        fullName: u.fullName || '',
                        email: u.email || '',
                        bio: u.bio || '',
                        location: u.location || '',
                        github: u.github || '',
                        linkedin: u.linkedin || '',
                    });
                    setProfilePhoto(u.profilePhoto || '');
                }

                // Fetch stats
                const statsResponse = await api.get(`/users/stats/${user.id}`);
                if (statsResponse.data?.stats) {
                    setStats(statsResponse.data.stats);
                }

                // Fetch projects
                const projectsResponse = await api.get(`/projects/user/${user.id}`);
                setUserProjects(projectsResponse.data?.projects || []);

                // Fetch badges
                const badgesResponse = await api.get(`/users/badges/${user.id}`);
                setBadges(badgesResponse.data?.badges || []);

                // Fetch skills
                const skillsResponse = await api.get(`/users/skills/${user.id}`);
                setSkills(skillsResponse.data?.skills || []);
            }
        } catch (error) {
            console.log('Using demo profile data');
            setStats({
                problemsSolved: 12,
                accuracy: 85,
                currentLevel: 'Silver',
                currentXp: 450,
                xpToNextLevel: 1000,
                totalPoints: 1250,
                currentStreak: 5,
            });
            setSkills([
                { name: 'JavaScript', problemsSolved: 8, proficiency: 75 },
                { name: 'Python', problemsSolved: 4, proficiency: 40 },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchUserData();
        setRefreshing(false);
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            await api.put(`/users/profile/${user.id}`, {
                ...profileData,
                profilePhoto,
            });
            setIsEditing(false);
            Alert.alert('Success', 'Profile updated successfully!');
        } catch (error) {
            Alert.alert('Error', 'Failed to save profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout },
        ]);
    };

    const handlePickImage = async () => {
        try {
            // Request permission
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile picture.');
                return;
            }

            // Launch image picker
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const imageUri = result.assets[0].uri;

                // For now, we'll use the local URI as a preview
                // In production, you'd upload to a cloud service like Cloudinary
                setProfilePhoto(imageUri);

                // Save to backend (the backend would need to handle file uploads)
                // For now, just save the URI (works for local testing)
                try {
                    await api.put(`/users/profile/${user.id}`, {
                        ...profileData,
                        profilePhoto: imageUri,
                    });
                    Alert.alert('Success', 'Profile photo updated!');
                } catch (error) {
                    console.log('Photo save error:', error);
                    // Still keep the local preview
                }
            }
        } catch (error) {
            console.error('Image picker error:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    // Group projects by category
    const groupedProjects = userProjects.reduce((acc, project) => {
        const category = project.category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(project);
        return acc;
    }, {});

    const getCategoryIcon = (category) => {
        const icons = { 'Web Development': '🌐', 'Data Science': '📊', 'Machine Learning': '🤖', 'Mobile Apps': '📱', 'Other': '📁' };
        return icons[category] || '📁';
    };

    const getBadgeIcon = (name) => {
        const icons = { Bronze: '🏆', Silver: '🛡️', Gold: '👑', Platinum: '💎', 'Problem Solver': '◎' };
        return icons[name] || '🏅';
    };

    const getDefaultBadges = () => [
        { id: 1, name: 'Bronze', description: 'Solve 10 problems', progress: Math.min(100, (stats.problemsSolved / 10) * 100), isEarned: stats.problemsSolved >= 10 },
        { id: 2, name: 'Silver', description: 'Solve 25 problems', progress: Math.min(100, (stats.problemsSolved / 25) * 100), isEarned: stats.problemsSolved >= 25 },
        { id: 3, name: 'Gold', description: 'Solve 50 problems', progress: Math.min(100, (stats.problemsSolved / 50) * 100), isEarned: stats.problemsSolved >= 50 },
        { id: 4, name: 'Problem Solver', description: '90%+ accuracy rate', progress: Math.min(100, (stats.accuracy / 90) * 100), isEarned: stats.accuracy >= 90 },
    ];

    const tabs = ['profile', 'statistics', 'submissions', 'achievements'];

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6366f1" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Profile Settings</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Manage your account and track progress.</Text>
            </View>

            {/* Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
                <View style={styles.tabs}>
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, { backgroundColor: theme.inputBackground, borderColor: theme.border }, activeTab === tab && styles.tabActive]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === tab && styles.tabTextActive]}>
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
            >
                {/* PROFILE TAB */}
                {activeTab === 'profile' && (
                    <View style={styles.tabContent}>
                        {/* Profile Card */}
                        <View style={[styles.profileCard, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]}>
                            <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage}>
                                {profilePhoto ? (
                                    <Image
                                        source={{ uri: profilePhoto }}
                                        style={styles.avatarImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>{profileData.fullName?.charAt(0) || '?'}</Text>
                                    </View>
                                )}
                                <View style={styles.cameraOverlay}>
                                    <Text style={styles.cameraIcon}>📷</Text>
                                </View>
                            </TouchableOpacity>
                            <Text style={[styles.profileName, { color: theme.text }]}>{profileData.fullName || 'User'}</Text>
                            <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>{profileData.email}</Text>
                            <View style={styles.levelBadge}>
                                <Text style={styles.levelBadgeText}>{stats.currentLevel} Level</Text>
                            </View>

                            <View style={styles.miniStats}>
                                <View style={styles.miniStatItem}>
                                    <Text style={[styles.miniStatValue, { color: theme.text }]}>{stats.problemsSolved}</Text>
                                    <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>Problems</Text>
                                </View>
                                <View style={styles.miniStatItem}>
                                    <Text style={[styles.miniStatValue, { color: theme.text }]}>{stats.accuracy}%</Text>
                                    <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>Accuracy</Text>
                                </View>
                            </View>

                            <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>Progress to Next Level</Text>
                            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                                <View style={[styles.progressFill, { width: `${(stats.currentXp / stats.xpToNextLevel) * 100}%` }]} />
                            </View>
                            <Text style={[styles.xpText, { color: theme.textMuted }]}>{stats.currentXp} / {stats.xpToNextLevel} XP</Text>
                        </View>

                        {/* Personal Info */}
                        <View style={styles.infoCard}>
                            <View style={styles.infoHeader}>
                                <Text style={styles.infoTitle}>Personal Information</Text>
                                {isEditing ? (
                                    <TouchableOpacity onPress={handleSaveProfile} disabled={saving}>
                                        <Text style={styles.saveBtn}>{saving ? 'Saving...' : '💾 Save'}</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity onPress={() => setIsEditing(true)}>
                                        <Text style={styles.editBtn}>✏️ Edit</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View style={styles.infoGrid}>
                                <View style={styles.infoItem}>
                                    <Text style={styles.infoLabel}>Full Name</Text>
                                    {isEditing ? (
                                        <TextInput
                                            style={styles.infoInput}
                                            value={profileData.fullName}
                                            onChangeText={(v) => setProfileData({ ...profileData, fullName: v })}
                                            placeholderTextColor="#64748b"
                                        />
                                    ) : (
                                        <Text style={styles.infoValue}>{profileData.fullName || 'Not set'}</Text>
                                    )}
                                </View>

                                <View style={styles.infoItem}>
                                    <Text style={styles.infoLabel}>Bio</Text>
                                    {isEditing ? (
                                        <TextInput
                                            style={[styles.infoInput, styles.infoTextArea]}
                                            value={profileData.bio}
                                            onChangeText={(v) => setProfileData({ ...profileData, bio: v })}
                                            placeholder="Tell us about yourself..."
                                            placeholderTextColor="#64748b"
                                            multiline={true}
                                        />
                                    ) : (
                                        <Text style={styles.infoValue}>{profileData.bio || 'No bio yet'}</Text>
                                    )}
                                </View>

                                <View style={styles.infoItem}>
                                    <Text style={styles.infoLabel}>Location</Text>
                                    {isEditing ? (
                                        <TextInput
                                            style={styles.infoInput}
                                            value={profileData.location}
                                            onChangeText={(v) => setProfileData({ ...profileData, location: v })}
                                            placeholder="City, Country"
                                            placeholderTextColor="#64748b"
                                        />
                                    ) : (
                                        <Text style={styles.infoValue}>{profileData.location || 'Not set'}</Text>
                                    )}
                                </View>

                                <View style={styles.infoItem}>
                                    <Text style={styles.infoLabel}>GitHub</Text>
                                    {isEditing ? (
                                        <TextInput
                                            style={styles.infoInput}
                                            value={profileData.github}
                                            onChangeText={(v) => setProfileData({ ...profileData, github: v })}
                                            placeholder="github.com/username"
                                            placeholderTextColor="#64748b"
                                        />
                                    ) : (
                                        <Text style={styles.infoValue}>{profileData.github || 'Not set'}</Text>
                                    )}
                                </View>

                                <View style={styles.infoItem}>
                                    <Text style={styles.infoLabel}>LinkedIn</Text>
                                    {isEditing ? (
                                        <TextInput
                                            style={styles.infoInput}
                                            value={profileData.linkedin}
                                            onChangeText={(v) => setProfileData({ ...profileData, linkedin: v })}
                                            placeholder="linkedin.com/in/username"
                                            placeholderTextColor="#64748b"
                                        />
                                    ) : (
                                        <Text style={styles.infoValue}>{profileData.linkedin || 'Not set'}</Text>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* Settings */}
                        <View style={styles.infoCard}>
                            <Text style={styles.infoTitle}>Settings</Text>

                            <View style={styles.settingItem}>
                                <View>
                                    <Text style={styles.settingLabel}>Dark Mode</Text>
                                    <Text style={styles.settingDesc}>Switch between light and dark theme</Text>
                                </View>
                                <Switch
                                    value={isDark}
                                    onValueChange={toggleTheme}
                                    trackColor={{ false: '#334155', true: '#6366f1' }}
                                    thumbColor="#f8fafc"
                                />
                            </View>

                            <View style={styles.settingItem}>
                                <View>
                                    <Text style={styles.settingLabel}>Notifications</Text>
                                    <Text style={styles.settingDesc}>Receive push notifications</Text>
                                </View>
                                <Switch
                                    value={notifications}
                                    onValueChange={setNotifications}
                                    trackColor={{ false: '#334155', true: '#6366f1' }}
                                    thumbColor="#f8fafc"
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.settingItem}
                                onPress={() => setReportModalVisible(true)}
                            >
                                <View>
                                    <Text style={styles.settingLabel}>Report an Issue</Text>
                                    <Text style={styles.settingDesc}>Found a bug or have feedback?</Text>
                                </View>
                                <Text style={styles.settingArrow}>→</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                                <Text style={styles.logoutBtnText}>🚪 Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* STATISTICS TAB */}
                {activeTab === 'statistics' && (
                    <View style={styles.tabContent}>
                        <Text style={styles.sectionTitle}>📈 Coding Statistics</Text>

                        <View style={styles.statGrid}>
                            <View style={[styles.statBox, styles.statBlue]}>
                                <Text style={styles.statBoxValue}>{stats.totalPoints?.toLocaleString()}</Text>
                                <Text style={styles.statBoxLabel}>Total Points</Text>
                            </View>
                            <View style={[styles.statBox, styles.statGreen]}>
                                <Text style={styles.statBoxValue}>{stats.currentStreak}</Text>
                                <Text style={styles.statBoxLabel}>Day Streak</Text>
                            </View>
                            <View style={[styles.statBox, styles.statPurple]}>
                                <Text style={styles.statBoxValue}>{stats.problemsSolved}</Text>
                                <Text style={styles.statBoxLabel}>Problems Solved</Text>
                            </View>
                            <View style={[styles.statBox, styles.statOrange]}>
                                <Text style={styles.statBoxValue}>{userProjects.length}</Text>
                                <Text style={styles.statBoxLabel}>Projects</Text>
                            </View>
                        </View>

                        <Text style={styles.sectionTitle}>Skills & Proficiency</Text>

                        {skills.length > 0 ? (
                            skills.map((skill, i) => (
                                <View key={i} style={styles.skillRow}>
                                    <View style={styles.skillHeader}>
                                        <Text style={styles.skillName}>{skill.name}</Text>
                                        <Text style={styles.skillProblems}>{skill.problemsSolved} problems</Text>
                                    </View>
                                    <View style={styles.skillBar}>
                                        <View style={[styles.skillFill, { width: `${skill.proficiency}%` }]} />
                                    </View>
                                    <Text style={styles.skillPercent}>{skill.proficiency}% proficiency</Text>
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No skills tracked yet. Start solving problems!</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* SUBMISSIONS TAB */}
                {activeTab === 'submissions' && (
                    <View style={styles.tabContent}>
                        <Text style={styles.sectionTitle}>📤 Project Submissions</Text>
                        <Text style={styles.sectionSubtitle}>Click on a category to view your projects</Text>

                        {Object.keys(groupedProjects).length > 0 ? (
                            <>
                                <View style={styles.categoryButtons}>
                                    {Object.entries(groupedProjects).map(([cat, projects]) => (
                                        <TouchableOpacity
                                            key={cat}
                                            style={[styles.categoryBtn, expandedCategory === cat && styles.categoryBtnActive]}
                                            onPress={() => setExpandedCategory(expandedCategory === cat ? null : cat)}
                                        >
                                            <Text style={styles.categoryIcon}>{getCategoryIcon(cat)}</Text>
                                            <Text style={styles.categoryName}>{cat}</Text>
                                            <View style={styles.categoryCount}>
                                                <Text style={styles.categoryCountText}>{projects.length}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {expandedCategory && groupedProjects[expandedCategory] && (
                                    <View style={styles.projectsList}>
                                        {groupedProjects[expandedCategory].map((project, i) => (
                                            <View key={i} style={styles.projectItem}>
                                                <Text style={styles.projectItemTitle}>{project.title}</Text>
                                                <Text style={styles.projectItemLang}>{project.language}</Text>
                                                <Text style={styles.projectItemDesc}>{project.description || 'No description'}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </>
                        ) : (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No projects submitted yet.</Text>
                                <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Upload')}>
                                    <Text style={styles.emptyBtnText}>➕ Upload Project</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {/* ACHIEVEMENTS TAB */}
                {activeTab === 'achievements' && (
                    <View style={styles.tabContent}>
                        <Text style={styles.sectionTitle}>🏅 Your Achievements</Text>
                        <Text style={styles.sectionSubtitle}>Unlock badges by solving problems</Text>

                        <View style={styles.badgeGrid}>
                            {(badges.length > 0 ? badges : getDefaultBadges()).map((badge) => (
                                <View key={badge.id} style={[styles.badgeCard, badge.isEarned && styles.badgeEarned]}>
                                    <View style={[styles.badgeIconBox, badge.isEarned && styles.badgeIconEarned]}>
                                        <Text style={styles.badgeIconText}>{getBadgeIcon(badge.name)}</Text>
                                    </View>
                                    <Text style={styles.badgeName}>{badge.name}</Text>
                                    <Text style={styles.badgeDesc}>{badge.description}</Text>
                                    {badge.isEarned ? (
                                        <Text style={styles.earnedTag}>✓ Earned</Text>
                                    ) : (
                                        <>
                                            <View style={styles.badgeProgress}>
                                                <View style={[styles.badgeProgressFill, { width: `${badge.progress}%` }]} />
                                            </View>
                                            <Text style={styles.badgePercent}>{Math.round(badge.progress)}% complete</Text>
                                        </>
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                <View style={styles.bottomPadding} />
            </ScrollView>
            <ReportModal
                visible={reportModalVisible}
                onClose={() => setReportModalVisible(false)}
            />
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    scrollView: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#f8fafc' },
    subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
    tabScroll: { maxHeight: 50, marginBottom: 8 },
    tabs: { flexDirection: 'row', paddingHorizontal: 16 },
    tab: { paddingHorizontal: 16, paddingVertical: 10, marginRight: 8, borderRadius: 20, backgroundColor: '#1e293b' },
    tabActive: { backgroundColor: '#6366f1' },
    tabText: { fontSize: 13, color: '#94a3b8' },
    tabTextActive: { color: '#f8fafc', fontWeight: '600' },
    tabContent: { paddingHorizontal: 16 },
    profileCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
    avatarContainer: { marginBottom: 12, position: 'relative' },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center' },
    avatarImage: { width: 80, height: 80, borderRadius: 40 },
    avatarText: { fontSize: 32, fontWeight: 'bold', color: '#f8fafc' },
    cameraOverlay: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
    cameraIcon: { fontSize: 14 },
    profileName: { fontSize: 20, fontWeight: 'bold', color: '#f8fafc' },
    profileEmail: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
    levelBadge: { backgroundColor: '#6366f120', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 12 },
    levelBadgeText: { fontSize: 12, color: '#a5b4fc', fontWeight: '500' },
    miniStats: { flexDirection: 'row', marginTop: 20 },
    miniStatItem: { alignItems: 'center', marginHorizontal: 24 },
    miniStatValue: { fontSize: 24, fontWeight: 'bold', color: '#f8fafc' },
    miniStatLabel: { fontSize: 12, color: '#94a3b8' },
    progressLabel: { fontSize: 12, color: '#94a3b8', marginTop: 16 },
    progressBar: { width: '100%', height: 8, backgroundColor: '#334155', borderRadius: 4, marginTop: 8 },
    progressFill: { height: '100%', backgroundColor: '#6366f1', borderRadius: 4 },
    xpText: { fontSize: 11, color: '#64748b', marginTop: 4 },
    infoCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
    infoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    infoTitle: { fontSize: 16, fontWeight: '600', color: '#f8fafc' },
    editBtn: { fontSize: 14, color: '#6366f1' },
    saveBtn: { fontSize: 14, color: '#22c55e' },
    infoGrid: {},
    infoItem: { marginBottom: 16 },
    infoLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 6 },
    infoValue: { fontSize: 14, color: '#f8fafc' },
    infoInput: { backgroundColor: '#0f172a', borderRadius: 10, padding: 12, fontSize: 14, color: '#f8fafc', borderWidth: 1, borderColor: '#334155' },
    infoTextArea: { minHeight: 80, textAlignVertical: 'top' },
    settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#334155' },
    settingLabel: { fontSize: 14, color: '#f8fafc' },
    settingDesc: { fontSize: 11, color: '#64748b' },
    settingArrow: { fontSize: 18, color: '#64748b' },
    logoutBtn: { backgroundColor: '#ef444420', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 16 },
    logoutBtnText: { fontSize: 14, fontWeight: '600', color: '#ef4444' },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#f8fafc', marginBottom: 8 },
    sectionSubtitle: { fontSize: 13, color: '#94a3b8', marginBottom: 16 },
    statGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
    statBox: { width: '48%', borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'center' },
    statBlue: { backgroundColor: '#3b82f620' },
    statGreen: { backgroundColor: '#22c55e20' },
    statPurple: { backgroundColor: '#8b5cf620' },
    statOrange: { backgroundColor: '#f5920b20' },
    statBoxValue: { fontSize: 28, fontWeight: 'bold', color: '#f8fafc' },
    statBoxLabel: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
    skillRow: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10 },
    skillHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    skillName: { fontSize: 14, fontWeight: '600', color: '#f8fafc' },
    skillProblems: { fontSize: 12, color: '#94a3b8' },
    skillBar: { height: 8, backgroundColor: '#334155', borderRadius: 4 },
    skillFill: { height: '100%', backgroundColor: '#6366f1', borderRadius: 4 },
    skillPercent: { fontSize: 11, color: '#64748b', marginTop: 6 },
    emptyState: { backgroundColor: '#1e293b', borderRadius: 12, padding: 32, alignItems: 'center' },
    emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
    emptyBtn: { backgroundColor: '#6366f1', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 16 },
    emptyBtnText: { fontSize: 14, fontWeight: '600', color: '#f8fafc' },
    categoryButtons: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
    categoryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, marginRight: 10, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
    categoryBtnActive: { borderColor: '#6366f1', backgroundColor: '#6366f120' },
    categoryIcon: { fontSize: 16, marginRight: 8 },
    categoryName: { fontSize: 13, color: '#f8fafc' },
    categoryCount: { backgroundColor: '#6366f1', marginLeft: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    categoryCountText: { fontSize: 11, color: '#f8fafc', fontWeight: '600' },
    projectsList: { backgroundColor: '#1e293b', borderRadius: 12, padding: 12 },
    projectItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#334155' },
    projectItemTitle: { fontSize: 15, fontWeight: '600', color: '#f8fafc' },
    projectItemLang: { fontSize: 11, color: '#a5b4fc', marginTop: 2 },
    projectItemDesc: { fontSize: 12, color: '#94a3b8', marginTop: 6 },
    badgeGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    badgeCard: { width: '46%', backgroundColor: '#1e293b', borderRadius: 16, padding: 16, margin: '2%', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
    badgeEarned: { borderColor: '#22c55e' },
    badgeIconBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    badgeIconEarned: { backgroundColor: '#22c55e20' },
    badgeIconText: { fontSize: 24 },
    badgeName: { fontSize: 14, fontWeight: '600', color: '#f8fafc', textAlign: 'center' },
    badgeDesc: { fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 4 },
    earnedTag: { fontSize: 12, color: '#22c55e', fontWeight: '500', marginTop: 10 },
    badgeProgress: { width: '100%', height: 6, backgroundColor: '#334155', borderRadius: 3, marginTop: 12 },
    badgeProgressFill: { height: '100%', backgroundColor: '#6366f1', borderRadius: 3 },
    badgePercent: { fontSize: 10, color: '#64748b', marginTop: 4 },
    bottomPadding: { height: 24 },
});

export default ProfileScreen;
