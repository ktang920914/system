import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';

export default function Bill() {
  const params = useLocalSearchParams();
  const { tableName, orderDetails, tableId } = params || {};
  
  const [parsedOrderDetails, setParsedOrderDetails] = useState({
    ordernumber: '',
    items: [],
    comboItems: [],
    createdAt: new Date().toISOString()
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all products from the database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://192.168.212.66:3000/api/product/get-products');
        const data = await response.json();
        if (response.ok) {
          setProducts(data);
        } else {
          Alert.alert('Error', 'Failed to fetch products');
        }
      } catch (error) {
        console.error('Fetch products error:', error);
        Alert.alert('Error', 'Failed to connect to server');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Parse order details and match with product data
  useEffect(() => {
    if (orderDetails && products.length > 0) {
      try {
        const parsed = JSON.parse(orderDetails);
        
        // Match items with product data to ensure correct tax rates
        const matchedItems = parsed.items?.map(item => {
          const product = products.find(p => p.productname === item.orderproductname);
          return {
            ...item,
            // Use the product's tax rate if available, otherwise keep the order's tax rate
            orderproducttax: product?.producttax ?? item.orderproducttax
          };
        }) || [];

        // Match combo items with product data
        const matchedComboItems = parsed.comboItems?.map(combo => {
          const product = products.find(p => p.productname === combo.comboproductitem);
          return {
            ...combo,
            // Use the product's tax rate if available, otherwise keep the order's tax rate
            comboproducttax: product?.producttax ?? combo.comboproducttax
          };
        }) || [];

        const updatedDetails = {
          ordernumber: parsed.ordernumber || '',
          items: matchedItems,
          comboItems: matchedComboItems,
          createdAt: parsed.createdAt || new Date().toISOString()
        };
        
        setParsedOrderDetails(updatedDetails);
      } catch (error) {
        console.error('Error parsing order details:', error);
      }
    }
  }, [orderDetails, products]);

  const calculateSubtotal = () => {
    let subtotal = 0;
    
    parsedOrderDetails.items?.forEach(item => {
      subtotal += (item.orderproductprice || 0) * (item.orderproductquantity || 0);
    });
    
    parsedOrderDetails.comboItems?.forEach(combo => {
      subtotal += (combo.comboproductprice || 0) * (combo.comboproductquantity || 0);
    });
    
    return subtotal;
  };

  const calculateTaxDetails = () => {
    let taxableAmount = 0;
    let taxAmount = 0;

    // Calculate for regular items
    parsedOrderDetails.items?.forEach(item => {
      const itemTotal = (item.orderproductprice || 0) * (item.orderproductquantity || 0);
      const itemTaxRate = item.orderproducttax || 0;
      
      if (itemTaxRate > 0) {
        taxableAmount += itemTotal;
        taxAmount += itemTotal * (itemTaxRate / 100);
      }
    });

    // Calculate for combo items
    parsedOrderDetails.comboItems?.forEach(combo => {
      const comboTotal = (combo.comboproductprice || 0) * (combo.comboproductquantity || 0);
      const comboTaxRate = combo.comboproducttax || 0;
      
      if (comboTaxRate > 0) {
        taxableAmount += comboTotal;
        taxAmount += comboTotal * (comboTaxRate / 100);
      }
    });

    return { taxableAmount, taxAmount };
  };

  const calculateNonTaxableAmount = () => {
    let nonTaxableAmount = 0;

    parsedOrderDetails.items?.forEach(item => {
      const itemTotal = (item.orderproductprice || 0) * (item.orderproductquantity || 0);
      if (item.orderproducttax === 0) {
        nonTaxableAmount += itemTotal;
      }
    });
    
    parsedOrderDetails.comboItems?.forEach(combo => {
      const comboTotal = (combo.comboproductprice || 0) * (combo.comboproductquantity || 0);
      if (combo.comboproducttax === 0) {
        nonTaxableAmount += comboTotal;
      }
    });
    
    return nonTaxableAmount;
  };

  const subtotal = calculateSubtotal();
  const { taxableAmount, taxAmount } = calculateTaxDetails();
  const nonTaxableAmount = calculateNonTaxableAmount();
  const totalAmount = subtotal + taxAmount;

  const handleDeleteItem = async (itemName, isCombo = false) => {
    try {
      if (!parsedOrderDetails?.ordernumber) {
        Alert.alert('Error', 'No order found');
        return;
      }

      const updatedItems = isCombo 
        ? parsedOrderDetails.items
        : parsedOrderDetails.items.filter(item => item.orderproductname !== itemName);
      
      const updatedCombos = isCombo
        ? parsedOrderDetails.comboItems.filter(combo => combo.comboproductitem !== itemName)
        : parsedOrderDetails.comboItems;
      
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
        const updatedDetails = {
          ...parsedOrderDetails,
          items: updatedItems,
          comboItems: updatedCombos,
          updatedAt: new Date().toISOString()
        };
        
        setParsedOrderDetails(updatedDetails);
        Alert.alert('Success', 'Item removed successfully');
      } else {
        Alert.alert('Error', result.message || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', 'An error occurred while removing the item');
    }
  };

  const handleAddMoreItems = () => {
    if (!parsedOrderDetails) return;
    
    router.navigate({
      pathname: '/add-order/Order',
      params: {
        tableId,
        tableName,
        existingOrder: JSON.stringify({
          ordernumber: parsedOrderDetails.ordernumber,
          items: parsedOrderDetails.items,
          comboItems: parsedOrderDetails.comboItems
        })
      }
    });
  };

  const handlePay = async () => {
    try {
      if (!parsedOrderDetails?.ordernumber) {
        Alert.alert('Error', 'No order found');
        return;
      }

      const response = await fetch(
        `http://192.168.212.66:3000/api/order/update-order-totals/${parsedOrderDetails.ordernumber}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subtotal: subtotal,
            taxableAmount: taxableAmount,
            taxAmount: taxAmount,
            ordertotal: totalAmount
          }),
        }
      );
  
      const result = await response.json();
      
      if (response.ok) {
        Alert.alert('Success', 'Payment processed successfully');
        // Navigate to payment complete screen or other action
      } else {
        Alert.alert('Error', result.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'An error occurred during payment');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading bill information...</Text>
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
          <Text className="text-lg font-bold">Order #{parsedOrderDetails?.ordernumber || ''}</Text>
        </View>
        
        <Text className="text-gray-500 mb-2.5">
          {new Date(parsedOrderDetails?.updatedAt || parsedOrderDetails?.updatedAt || new Date()).toLocaleString()}
        </Text>
      </View>

      <View className="mb-5">
        <Text className="text-lg font-bold mb-2.5">Items:</Text>
        
        {parsedOrderDetails?.items?.map((item, index) => (
          <View key={`item-${index}`} className="flex-row justify-between mb-2 pb-2 border-b border-gray-100">
            <View className="flex-1">
              <Text className="text-base">{item.orderproductname}</Text>
              <Text className="text-sm text-gray-500">
                x{item.orderproductquantity} • 
                {item.orderproducttax > 0 ? (
                  <Text> Tax: {item.orderproducttax}% (RM {((item.orderproductprice * item.orderproductquantity * item.orderproducttax / 100).toFixed(2))})</Text>
                ) : (
                  <Text> No Tax</Text>
                )}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-base font-bold mr-4">
                RM {((item.orderproductprice || 0) * (item.orderproductquantity || 0)).toFixed(2)}
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

        {parsedOrderDetails?.comboItems?.map((combo, index) => {
          const groupedChoices = {};
          combo.combochooseitems?.forEach(item => {
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
                  <Text className="text-sm text-gray-500">
                    x{combo.comboproductquantity} • 
                    {combo.comboproducttax > 0 ? (
                      <Text> Tax: {combo.comboproducttax}% (RM {((combo.comboproductprice * combo.comboproductquantity * combo.comboproducttax / 100).toFixed(2))})</Text>
                    ) : (
                      <Text> No Tax</Text>
                    )}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-base font-bold mr-4">
                    RM {((combo.comboproductprice || 0) * (combo.comboproductquantity || 0)).toFixed(2)}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => handleDeleteItem(combo.comboproductitem, true)}
                    className="bg-red-500 px-2 py-1 rounded"
                  >
                    <Text className="text-white">Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
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
          <Text className="text-base">Non-Taxable Amount:</Text>
          <Text className="text-base">RM {nonTaxableAmount.toFixed(2)}</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-base">Taxable Amount:</Text>
          <Text className="text-base">RM {taxableAmount.toFixed(2)}</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-base">Tax:</Text>
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