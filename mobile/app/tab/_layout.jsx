import { View, Text } from 'react-native';
import React from 'react';
import { Tabs } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function _Layout() {
  return ( 
    <Tabs  screenOptions={{
      tabBarActiveTintColor: 'blue', // 激活状态下的标签颜色
      tabBarInactiveTintColor: 'gray', // 未激活状态下的标签颜色
    }}>
  <Tabs.Screen name="Profile" options={{ title: 'Home', tabBarIcon: ({ color, size }) => (
            <AntDesign name="home" size={22} color={color} />
          ), }} />
  <Tabs.Screen name="Table" options={{ title: 'Table', tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="table-bar" size={28} color={color} />
          ), }} />
</Tabs>
  );
}