import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';

import { useAuth } from '../context/AuthContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProblemSolvingScreen from '../screens/ProblemSolvingScreen';
import CodeAnalyzerScreen from '../screens/CodeAnalyzerScreen';
import CodeConverterScreen from '../screens/CodeConverterScreen';
import UploadProjectScreen from '../screens/UploadProjectScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack - Login/Register screens
const AuthStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0f172a' },
        }}
    >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
);

// Tools Stack - Analyzer + Converter
const ToolsStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0f172a' },
        }}
    >
        <Stack.Screen name="CodeAnalyzer" component={CodeAnalyzerScreen} />
        <Stack.Screen name="CodeConverter" component={CodeConverterScreen} />
    </Stack.Navigator>
);

// Main Tabs - After login
const MainTabs = () => (
    <Tab.Navigator
        screenOptions={{
            headerShown: false,
            tabBarStyle: {
                backgroundColor: '#1e293b',
                borderTopColor: '#334155',
                borderTopWidth: 1,
                height: 64,
                paddingBottom: 10,
                paddingTop: 8,
            },
            tabBarActiveTintColor: '#6366f1',
            tabBarInactiveTintColor: '#64748b',
            tabBarLabelStyle: {
                fontSize: 10,
                fontWeight: '500',
            },
        }}
    >
        <Tab.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{
                tabBarLabel: 'Home',
                tabBarIcon: ({ focused }) => (
                    <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>🏠</Text>
                ),
            }}
        />
        <Tab.Screen
            name="ProblemSolving"
            component={ProblemSolvingScreen}
            options={{
                tabBarLabel: 'Problems',
                tabBarIcon: ({ focused }) => (
                    <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>💡</Text>
                ),
            }}
        />
        <Tab.Screen
            name="Tools"
            component={ToolsStack}
            options={{
                tabBarLabel: 'Analyzer',
                tabBarIcon: ({ focused }) => (
                    <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>🔍</Text>
                ),
            }}
        />
        <Tab.Screen
            name="Upload"
            component={UploadProjectScreen}
            options={{
                tabBarLabel: 'Projects',
                tabBarIcon: ({ focused }) => (
                    <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>📁</Text>
                ),
            }}
        />
        <Tab.Screen
            name="Leaderboard"
            component={LeaderboardScreen}
            options={{
                tabBarLabel: 'Ranks',
                tabBarIcon: ({ focused }) => (
                    <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>🏆</Text>
                ),
            }}
        />
        <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
                tabBarLabel: 'Profile',
                tabBarIcon: ({ focused }) => (
                    <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>👤</Text>
                ),
            }}
        />
    </Tab.Navigator>
);

// Admin Tabs - For admin users
const AdminTabs = () => (
    <Tab.Navigator
        screenOptions={{
            headerShown: false,
            tabBarStyle: {
                backgroundColor: '#1e293b',
                borderTopColor: '#334155',
                borderTopWidth: 1,
                height: 64,
                paddingBottom: 10,
                paddingTop: 8,
            },
            tabBarActiveTintColor: '#6366f1',
            tabBarInactiveTintColor: '#64748b',
            tabBarLabelStyle: {
                fontSize: 10,
                fontWeight: '500',
            },
        }}
    >
        <Tab.Screen
            name="AdminDashboard"
            component={AdminDashboardScreen}
            options={{
                tabBarLabel: 'Dashboard',
                tabBarIcon: ({ focused }) => (
                    <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>📊</Text>
                ),
            }}
        />
        <Tab.Screen
            name="Leaderboard"
            component={LeaderboardScreen}
            options={{
                tabBarLabel: 'Users',
                tabBarIcon: ({ focused }) => (
                    <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>👥</Text>
                ),
            }}
        />
        <Tab.Screen
            name="Upload"
            component={UploadProjectScreen}
            options={{
                tabBarLabel: 'Projects',
                tabBarIcon: ({ focused }) => (
                    <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>📁</Text>
                ),
            }}
        />
        <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
                tabBarLabel: 'Settings',
                tabBarIcon: ({ focused }) => (
                    <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>⚙️</Text>
                ),
            }}
        />
    </Tab.Navigator>
);

// Main Navigator
const AppNavigator = () => {
    const { isLoggedIn, loading, user } = useAuth();

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.logo}>{'</>'}</Text>
                <Text style={styles.loadingText}>CodeGenius</Text>
            </View>
        );
    }

    // Check if user is admin (case-insensitive)
    const isAdmin = user?.role?.toLowerCase() === 'admin';
    console.log('User role:', user?.role, 'isAdmin:', isAdmin);

    return (
        <NavigationContainer>
            {isLoggedIn ? (isAdmin ? <AdminTabs /> : <MainTabs />) : <AuthStack />}
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    tabIcon: {
        fontSize: 20,
    },
    tabIconActive: {
        transform: [{ scale: 1.1 }],
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0f172a',
    },
    logo: {
        fontSize: 48,
        color: '#6366f1',
        fontWeight: 'bold',
        marginBottom: 16,
    },
    loadingText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
});

export default AppNavigator;
