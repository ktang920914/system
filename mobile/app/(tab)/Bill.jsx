import { View, Text, ScrollView } from 'react-native';
import React, { useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';

export default function Bill() {
  const params = useLocalSearchParams();
  const { tableName, orderDetails } = params || {};
  
  const parsedOrderDetails = orderDetails ? JSON.parse(orderDetails) : null;

  useEffect(() => {
    console.log('Order details:', parsedOrderDetails);
  }, [parsedOrderDetails]);

  if (!parsedOrderDetails) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>No order details available</Text>
      </View>
    );
  }

  const calculateSubtotal = () => {
    let subtotal = 0;
    
    parsedOrderDetails.items.forEach(item => {
      subtotal += item.orderproductprice * item.orderproductquantity;
    });
    
    parsedOrderDetails.comboItems.forEach(combo => {
      subtotal += combo.comboproductprice * combo.comboproductquantity;
    });
    
    return subtotal;
  };

  const subtotal = calculateSubtotal();
  const taxRate = parsedOrderDetails.taxRate / 100 || 0.08;
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <View className="mb-5 border-b border-gray-200 pb-2.5">
        <Text className="text-2xl font-bold text-center">Order Bill</Text>
        <Text className="text-lg text-center mt-1 text-gray-600">Table: {tableName}</Text>
      </View>

      <View className="mb-5">
        <Text className="text-lg font-bold mb-2.5">Order #{parsedOrderDetails.ordernumber}</Text>
        <Text className="text-gray-500 mb-2.5">
          {new Date(parsedOrderDetails.createdAt).toLocaleString()}
        </Text>
      </View>

      <View className="mb-5">
        <Text className="text-lg font-bold mb-2.5">Items:</Text>
        
        {parsedOrderDetails.items.map((item, index) => (
          <View key={`item-${index}`} className="flex-row justify-between mb-2 pb-2 border-b border-gray-100">
            <Text className="text-base flex-2">{item.orderproductname}</Text>
            <View className="flex-1 flex-row justify-between">
              <Text className="text-base text-gray-600">x{item.orderproductquantity}</Text>
              <Text className="text-base font-bold">
                RM {(item.orderproductprice * item.orderproductquantity).toFixed(2)}
              </Text>
            </View>
          </View>
        ))}

        {parsedOrderDetails.comboItems.map((combo, index) => (
          <View key={`combo-${index}`}>
            <View className="flex-row justify-between mb-2 pb-2 border-b border-gray-100">
              <Text className="text-base flex-2">{combo.comboproductitem} (Combo)</Text>
              <View className="flex-1 flex-row justify-between">
                <Text className="text-base text-gray-600">x{combo.comboproductquantity}</Text>
                <Text className="text-base font-bold">
                  RM {(combo.comboproductprice * combo.comboproductquantity).toFixed(2)}
                </Text>
              </View>
            </View>
            
            {combo.combochooseitems.map((item, itemIndex) => (
              <View key={`combo-item-${index}-${itemIndex}`} className="pl-5 mb-1">
                <Text className="text-sm text-gray-500">• {item.combochooseitemname} (x{item.combochooseitemquantity})</Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      <View className="mt-5 border-t border-gray-200 pt-2.5">
        <View className="flex-row justify-between mb-2">
          <Text className="text-base">Subtotal:</Text>
          <Text className="text-base font-bold">RM {subtotal.toFixed(2)}</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-base">Tax ({parsedOrderDetails.taxRate || 8}%):</Text>
          <Text className="text-base font-bold">RM {taxAmount.toFixed(2)}</Text>
        </View>
        <View className="flex-row justify-between mb-2 mt-2.5 pt-2.5 border-t border-gray-200">
          <Text className="text-lg font-bold">Total:</Text>
          <Text className="text-lg font-bold text-teal-700">RM {totalAmount.toFixed(2)}</Text>
        </View>
      </View>
    </ScrollView>
  );
}