import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';

export default function Bill() {
  const params = useLocalSearchParams();
  const { tableName, orderDetails, tableId } = params || {};
  
  const [parsedOrderDetails, setParsedOrderDetails] = useState(
    orderDetails ? JSON.parse(orderDetails) : null
  );

  useEffect(() => {
    if (orderDetails) {
      setParsedOrderDetails(JSON.parse(orderDetails));
    }
  }, [orderDetails]);

  const calculateSubtotal = () => {
    let subtotal = 0;
    
    parsedOrderDetails?.items.forEach(item => {
      subtotal += item.orderproductprice * item.orderproductquantity;
    });
    
    parsedOrderDetails?.comboItems.forEach(combo => {
      subtotal += combo.comboproductprice * combo.comboproductquantity;
    });
    
    return subtotal;
  };

  const subtotal = calculateSubtotal();
  const taxRate = parsedOrderDetails?.taxRate / 100 || 0.08;
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;

  const handleDeleteItem = async (itemName, isCombo = false) => {
    try {
      // Create updated order data without the deleted item
      const updatedItems = parsedOrderDetails.items.filter(
        item => item.orderproductname !== itemName
      );
      
      const updatedCombos = parsedOrderDetails.comboItems.filter(
        combo => combo.comboproductitem !== itemName
      );
      
      const updateData = {
        orderitems: updatedItems,
        ordercomboitem: updatedCombos
      };
      
      const response = await fetch(
        `http://192.168.212.66:3000/api/order/update-order/${parsedOrderDetails.ordernumber}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      );
      
      const result = await response.json();
      
      if (response.ok) {
        Alert.alert('Success', 'Item removed successfully');
        
        // Update local order data
        setParsedOrderDetails(prev => ({
          ...prev,
          items: updatedItems,
          comboItems: updatedCombos,
          createdAt: new Date().toISOString()
        }));
      } else {
        Alert.alert('Error', result.message || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', 'An error occurred while removing the item');
    }
  };

  const handleAddMoreItems = () => {
    router.navigate({
      pathname: '/add-order/Order',
      params: {
        tableId,
        tableName,
        existingOrder: JSON.stringify({
          ordernumber: parsedOrderDetails.ordernumber,
          items: parsedOrderDetails.items,
          comboItems: parsedOrderDetails.comboItems,
          taxRate: parsedOrderDetails.taxRate || 8
        })
      }
    });
  };

  const handlePay = () => {
    Alert.alert('Payment', 'Proceeding to payment...');
  };

  if (!parsedOrderDetails) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>No order details available</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <View className="mb-5 border-b border-gray-200 pb-2.5">
        <Text className="text-2xl font-bold text-center">Order Bill</Text>
        <Text className="text-lg text-center mt-1 text-gray-600">Table: {tableName}</Text>
      </View>

      <View className="mb-5">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-lg font-bold">Order #{parsedOrderDetails.ordernumber}</Text>
        </View>
        
        <Text className="text-gray-500 mb-2.5">
          {new Date(parsedOrderDetails.createdAt).toLocaleString()}
        </Text>
      </View>

      <View className="mb-5">
        <Text className="text-lg font-bold mb-2.5">Items:</Text>
        
        {parsedOrderDetails.items.map((item, index) => (
          <View key={`item-${index}`} className="flex-row justify-between mb-2 pb-2 border-b border-gray-100">
            <View className="flex-1">
              <Text className="text-base">{item.orderproductname}</Text>
              <Text className="text-sm text-gray-500">x{item.orderproductquantity}</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-base font-bold mr-4">
                RM {(item.orderproductprice * item.orderproductquantity).toFixed(2)}
              </Text>
              <TouchableOpacity 
                onPress={() => handleDeleteItem(item.orderproductname)}
                className="bg-red-500 px-2 py-1 rounded"
              >
                <Text className="text-white">Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {parsedOrderDetails.comboItems.map((combo, index) => {
          // Group combo items by their groupIndex
          const groupedChoices = {};
          combo.combochooseitems.forEach(item => {
            const groupIndex = item.groupIndex || 0;
            if (!groupedChoices[groupIndex]) {
              groupedChoices[groupIndex] = [];
            }
            groupedChoices[groupIndex].push(item);
          });

          return (
            <View key={`combo-${index}`} className="mb-2 pb-2 border-b border-gray-100">
              <View className="flex-row justify-between">
                <View className="flex-1">
                  <Text className="text-base">{combo.comboproductitem} (Combo)</Text>
                  <Text className="text-sm text-gray-500">x{combo.comboproductquantity}</Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-base font-bold mr-4">
                    RM {(combo.comboproductprice * combo.comboproductquantity).toFixed(2)}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => handleDeleteItem(combo.comboproductitem, true)}
                    className="bg-red-500 px-2 py-1 rounded"
                  >
                    <Text className="text-white">Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Display grouped choices */}
              {Object.entries(groupedChoices).map(([groupIndex, items]) => (
                <View key={`group-${groupIndex}`} className="pl-5 mt-1">
                  <Text className="text-xs text-gray-500">Set {parseInt(groupIndex) + 1}:</Text>
                  {items.map((item, itemIndex) => (
                    <Text key={`combo-item-${index}-${itemIndex}`} className="text-sm text-gray-500 ml-2">
                      • {item.combochooseitemname} (x{item.combochooseitemquantity})
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          );
        })}
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

      <View className="mt-5 flex-row justify-between">
        <TouchableOpacity 
          onPress={handleAddMoreItems}
          className="bg-blue-500 px-4 py-2 rounded flex-1 mr-2"
        >
          <Text className="text-white text-center">Add More Items</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handlePay}
          className="bg-green-500 px-4 py-2 rounded flex-1 ml-2"
        >
          <Text className="text-white text-center">Pay Now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}