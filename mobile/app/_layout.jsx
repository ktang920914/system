import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Table from './tab/Table';
import Order from '../components/Order'; 

const Stack = createStackNavigator();

export default function App() {
  return (
    <Stack.Navigator initialRouteName="Table">
      <Stack.Screen name="Table" component={Table} />
      <Stack.Screen name="Order" component={Order} />
    </Stack.Navigator>
  );
}