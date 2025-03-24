import { Tabs } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: 'blue',
      tabBarInactiveTintColor: 'gray',
    }}>
      <Tabs.Screen 
        name="tab/Table" // 使用完整的路由名称
        options={{ 
          title: 'Table', 
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="table-bar" size={28} color={color} />
          ), 
        }} 
      />

      <Tabs.Screen 
        name="tab/Profile" // 使用完整的路由名称
        options={{ 
          title: 'Profile', 
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="user" size={22} color={color} />
          ), 
        }} 
      />
    </Tabs>
  );
}