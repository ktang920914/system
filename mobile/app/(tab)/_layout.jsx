import React from 'react'
import { Tabs } from 'expo-router'
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AntDesign from '@expo/vector-icons/AntDesign';

export default function _layout() {
  return (
    <Tabs>
      <Tabs.Screen 
        name='Table' 
        options={{
          tabBarIcon: ({color, size}) => <MaterialIcons name="table-bar" size={size} color={color} />
        }} 
      />
      <Tabs.Screen name='Profile'
      options={{
        tabBarIcon: ({color, size}) => <AntDesign name="user" size={size} color={color} />
      }}  />
    </Tabs>
  )
}