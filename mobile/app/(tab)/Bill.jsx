import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';

export default function Bill() {
  const params = useLocalSearchParams();
  const { tableName, orderDetails, tableId } = params || {};
  
  const [parsedOrderDetails, setParsedOrderDetails] = useState(
    orderDetails ? JSON.parse(orderDetails) : null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [modifiedItems, setModifiedItems] = useState({});
  const [modifiedCombos, setModifiedCombos] = useState({});

  useEffect(() => {
    if (orderDetails) {
      const details = JSON.parse(orderDetails);
      setParsedOrderDetails(details);
      
      // 初始化修改状态
      const itemsState = {};
      details.items.forEach(item => {
        itemsState[item.orderproductname] = item.orderproductquantity;
      });
      setModifiedItems(itemsState);
      
      const combosState = {};
      details.comboItems.forEach(combo => {
        combosState[combo.comboproductitem] = {
          quantity: combo.comboproductquantity,
          selections: combo.combochooseitems.reduce((acc, item) => {
            acc[item.combochooseitemname] = item.combochooseitemquantity;
            return acc;
          }, {})
        };
      });
      setModifiedCombos(combosState);
    }
  }, [orderDetails]);

  const handleQuantityChange = (itemName, change) => {
    const newQuantity = (modifiedItems[itemName] || 0) + change;
    if (newQuantity < 0) return;
    
    setModifiedItems(prev => ({
      ...prev,
      [itemName]: newQuantity
    }));
  };

  const handleComboQuantityChange = (comboName, change) => {
    const current = modifiedCombos[comboName] || { quantity: 0, selections: {} };
    const newQuantity = current.quantity + change;
    if (newQuantity < 0) return;
    
    setModifiedCombos(prev => ({
      ...prev,
      [comboName]: {
        ...current,
        quantity: newQuantity
      }
    }));
  };

  const calculateSubtotal = () => {
    let subtotal = 0;
    
    parsedOrderDetails?.items.forEach(item => {
      const quantity = isEditing ? modifiedItems[item.orderproductname] || 0 : item.orderproductquantity;
      subtotal += item.orderproductprice * quantity;
    });
    
    parsedOrderDetails?.comboItems.forEach(combo => {
      const quantity = isEditing ? modifiedCombos[combo.comboproductitem]?.quantity || 0 : combo.comboproductquantity;
      subtotal += combo.comboproductprice * quantity;
    });
    
    return subtotal;
  };

  const subtotal = calculateSubtotal();
  const taxRate = parsedOrderDetails?.taxRate / 100 || 0.08;
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;

  const handleUpdateOrder = async () => {
    try {
      const updatedItems = parsedOrderDetails.items
        .filter(item => (modifiedItems[item.orderproductname] || 0) > 0)
        .map(item => ({
          orderproductname: item.orderproductname,
          orderproductquantity: modifiedItems[item.orderproductname],
          orderproductprice: item.orderproductprice
        }));
      
      const updatedCombos = parsedOrderDetails.comboItems
        .filter(combo => (modifiedCombos[combo.comboproductitem]?.quantity || 0) > 0)
        .map(combo => ({
          comboproductitem: combo.comboproductitem,
          comboproductquantity: modifiedCombos[combo.comboproductitem].quantity,
          comboproductprice: combo.comboproductprice,
          combochooseitems: Object.entries(modifiedCombos[combo.comboproductitem].selections || {})
            .map(([name, qty]) => ({
              combochooseitemname: name,
              combochooseitemquantity: qty
            }))
        }));
      
      const updateData = {
        orderitems: updatedItems,
        ordercomboitem: updatedCombos
      };
      
      const response = await fetch(`http://192.168.212.66:3000/api/order/update-order/${parsedOrderDetails.ordernumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        Alert.alert('Success', 'Order updated successfully');
        setIsEditing(false);
        
        // 更新本地订单数据
        setParsedOrderDetails(prev => ({
          ...prev,
          items: updatedItems,
          comboItems: updatedCombos,
          createdAt: new Date().toISOString()
        }));
      } else {
        Alert.alert('Error', result.message || 'Failed to update order');
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'An error occurred while updating the order');
    }
  };

  const handleAddMoreItems = () => {
    router.navigate({
      pathname: '/(tab)/Order',
      params: {
        tableId,
        tableName,
        existingOrder: JSON.stringify(parsedOrderDetails)
      }
    });
  };

  const handlePay = () => {
    // 实现支付逻辑
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
          {!isEditing ? (
            <TouchableOpacity 
              onPress={() => setIsEditing(true)}
              className="bg-blue-500 px-3 py-1 rounded"
            >
              <Text className="text-white">Edit</Text>
            </TouchableOpacity>
          ) : (
            <View className="flex-row">
              <TouchableOpacity 
                onPress={() => {
                  setIsEditing(false);
                  // 重置修改
                  const itemsState = {};
                  parsedOrderDetails.items.forEach(item => {
                    itemsState[item.orderproductname] = item.orderproductquantity;
                  });
                  setModifiedItems(itemsState);
                  
                  const combosState = {};
                  parsedOrderDetails.comboItems.forEach(combo => {
                    combosState[combo.comboproductitem] = {
                      quantity: combo.comboproductquantity,
                      selections: combo.combochooseitems.reduce((acc, item) => {
                        acc[item.combochooseitemname] = item.combochooseitemquantity;
                        return acc;
                      }, {})
                    };
                  });
                  setModifiedCombos(combosState);
                }}
                className="bg-gray-500 px-3 py-1 rounded mr-2"
              >
                <Text className="text-white">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleUpdateOrder}
                className="bg-green-500 px-3 py-1 rounded"
              >
                <Text className="text-white">Save</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <Text className="text-gray-500 mb-2.5">
          {new Date(parsedOrderDetails.createdAt).toLocaleString()}
        </Text>
      </View>

      <View className="mb-5">
        <Text className="text-lg font-bold mb-2.5">Items:</Text>
        
        {parsedOrderDetails.items.map((item, index) => {
          const quantity = isEditing ? modifiedItems[item.orderproductname] || 0 : item.orderproductquantity;
          if (quantity <= 0 && isEditing) return null;
          
          return (
            <View key={`item-${index}`} className="flex-row justify-between mb-2 pb-2 border-b border-gray-100">
              <Text className="text-base flex-2">{item.orderproductname}</Text>
              <View className="flex-1 flex-row justify-between items-center">
                {isEditing ? (
                  <View className="flex-row items-center">
                    <TouchableOpacity 
                      onPress={() => handleQuantityChange(item.orderproductname, -1)}
                      className="bg-gray-200 px-2 py-1 rounded-l"
                    >
                      <Text>-</Text>
                    </TouchableOpacity>
                    <Text className="px-2">{quantity}</Text>
                    <TouchableOpacity 
                      onPress={() => handleQuantityChange(item.orderproductname, 1)}
                      className="bg-gray-200 px-2 py-1 rounded-r"
                    >
                      <Text>+</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text className="text-base text-gray-600"> x{quantity}</Text>
                )}
                <Text className="text-base font-bold">
                  RM {(item.orderproductprice * quantity).toFixed(2)}
                </Text>
              </View>
            </View>
          );
        })}

        {parsedOrderDetails.comboItems.map((combo, index) => {
          const comboData = isEditing ? modifiedCombos[combo.comboproductitem] : {
            quantity: combo.comboproductquantity,
            selections: combo.combochooseitems.reduce((acc, item) => {
              acc[item.combochooseitemname] = item.combochooseitemquantity;
              return acc;
            }, {})
          };
          
          if (comboData.quantity <= 0 && isEditing) return null;
          
          return (
            <View key={`combo-${index}`}>
              <View className="flex-row justify-between mb-2 pb-2 border-b border-gray-100">
                <Text className="text-base flex-2">{combo.comboproductitem} (Combo)</Text>
                <View className="flex-1 flex-row justify-between items-center">
                  {isEditing ? (
                    <View className="flex-row items-center">
                      <TouchableOpacity 
                        onPress={() => handleComboQuantityChange(combo.comboproductitem, -1)}
                        className="bg-gray-200 px-2 py-1 rounded-l"
                      >
                        <Text>-</Text>
                      </TouchableOpacity>
                      <Text className="px-2">{comboData.quantity}</Text>
                      <TouchableOpacity 
                        onPress={() => handleComboQuantityChange(combo.comboproductitem, 1)}
                        className="bg-gray-200 px-2 py-1 rounded-r"
                      >
                        <Text>+</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text className="text-base text-gray-600"> x{comboData.quantity}</Text>
                  )}
                  <Text className="text-base font-bold">
                    RM {(combo.comboproductprice * comboData.quantity).toFixed(2)}
                  </Text>
                </View>
              </View>
              
              {Object.entries(comboData.selections).map(([name, qty], itemIndex) => (
                <View key={`combo-item-${index}-${itemIndex}`} className="pl-5 mb-1">
                  <Text className="text-sm text-gray-500">• {name} (x{qty})</Text>
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