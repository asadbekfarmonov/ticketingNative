import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Ionicons} from '@expo/vector-icons';
import {GuestsScreen} from '../screens/GuestsScreen';
import {ImportScreen} from '../screens/ImportScreen';
import {ScanScreen} from '../screens/ScanScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {RootTabParamList, GuestsStackParamList} from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const GuestsStack = createNativeStackNavigator<GuestsStackParamList>();

const GuestsStackNavigator = () => (
  <GuestsStack.Navigator>
    <GuestsStack.Screen
      name="Guests"
      component={GuestsScreen}
      options={{headerShown: false}}
    />
    <GuestsStack.Screen name="Settings" component={SettingsScreen} options={{title: 'Settings'}} />
  </GuestsStack.Navigator>
);

export const BottomTabs = () => (
  <Tab.Navigator
    screenOptions={({route}) => ({
      headerShown: false,
      tabBarActiveTintColor: '#1E88E5',
      tabBarIcon: ({color, size}) => {
        let iconName: keyof typeof Ionicons.glyphMap = 'people-outline';
        if (route.name === 'Import') {
          iconName = 'download-outline';
        } else if (route.name === 'Scan') {
          iconName = 'qr-code-outline';
        } else {
          iconName = 'people-outline';
        }
        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen
      name="GuestsStack"
      component={GuestsStackNavigator}
      options={{title: 'Guests'}}
    />
    <Tab.Screen name="Import" component={ImportScreen} />
    <Tab.Screen name="Scan" component={ScanScreen} />
  </Tab.Navigator>
);
