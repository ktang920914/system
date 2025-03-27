import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Tabs } from 'expo-router/tabs';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function Cart() {
  const params = useLocalSearchParams();
  const { tableName, orderDetails, tableId } = params || {};
  
  const [currentOrder, setCurrentOrder] = useState({
    ordernumber: '',
    items: [],
    comboItems: [],
    createdAt: new Date().toISOString(),
    status: 'pending'
  });

  const [allOrders, setAllOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('current');

  const fetchData = async () => {
    try {
      setRefreshing(true);
      await Promise.all([fetchProducts(), fetchOrders()]);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://192.168.212.66:3000/api/product/get-products');
      const data = await response.json();
      if (response.ok) setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://192.168.212.66:3000/api/order/get-orders');
      const data = await response.json();
      if (response.ok) setAllOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  useEffect(() => {
    if (!orderDetails || orderDetails === 'null' || orderDetails === 'undefined') {
      return;
    }

    try {
      const parsed = JSON.parse(orderDetails);
      if (!parsed) return;

      if (parsed.status !== 'completed') {
        const matchedItems = parsed.items?.map(item => {
          const product = products.find(p => p.productname === item.orderproductname);
          return {
            ...item,
            orderproducttax: product?.producttax ?? item.orderproducttax
          };
        }) || [];
    
        const matchedComboItems = parsed.comboItems?.map(combo => {
          const product = products.find(p => p.productname === combo.comboproductitem);
          
          const processChosenItems = (items) => {
            if (!items) return [];
            return items.map(item => {
              if (typeof item === 'string') return item;
              
              if (item.combochooseitemname) return item.combochooseitemname;
              if (item.productname) return item.productname;
              if (item.name) return item.name;
              if (item.itemName) return item.itemName;
              
              if (item.productId) {
                const product = products.find(p => p._id === item.productId);
                return product?.productname || 'Unknown Item';
              }
              
              return 'Unknown Item';
            }).filter(Boolean);
          };
          
          return {
            ...combo,
            comboproducttax: product?.producttax ?? combo.comboproducttax,
            chosenItems: processChosenItems(combo.combochooseitems),
            combochooseitems: combo.combochooseitems
          };
        }) || [];
    
        setCurrentOrder({
          ordernumber: parsed.ordernumber || '',
          items: matchedItems,
          comboItems: matchedComboItems,
          createdAt: parsed.createdAt || new Date().toISOString(),
          status: parsed.status || 'pending',
          updatedAt: parsed.updatedAt || new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error parsing order details:', error);
      setCurrentOrder({
        ordernumber: '',
        items: [],
        comboItems: [],
        createdAt: new Date().toISOString(),
        status: 'pending'
      });
    }
  }, [orderDetails, products]);

  const calculateSubtotal = () => {
    let subtotal = 0;
    currentOrder.items?.forEach(item => {
      subtotal += (item.orderproductprice || 0) * (item.orderproductquantity || 0);
    });
    currentOrder.comboItems?.forEach(combo => {
      subtotal += (combo.comboproductprice || 0) * (combo.comboproductquantity || 0);
    });
    return subtotal;
  };

  const calculateTaxDetails = () => {
    let taxableAmount = 0;
    let taxAmount = 0;

    currentOrder.items?.forEach(item => {
      const itemTotal = (item.orderproductprice || 0) * (item.orderproductquantity || 0);
      const itemTaxRate = item.orderproducttax || 0;
      if (itemTaxRate > 0) {
        taxableAmount += itemTotal;
        taxAmount += itemTotal * (itemTaxRate / 100);
      }
    });

    currentOrder.comboItems?.forEach(combo => {
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
    currentOrder.items?.forEach(item => {
      const itemTotal = (item.orderproductprice || 0) * (item.orderproductquantity || 0);
      if (item.orderproducttax === 0) nonTaxableAmount += itemTotal;
    });
    currentOrder.comboItems?.forEach(combo => {
      const comboTotal = (combo.comboproductprice || 0) * (combo.comboproductquantity || 0);
      if (combo.comboproducttax === 0) nonTaxableAmount += comboTotal;
    });
    return nonTaxableAmount;
  };

  const subtotal = calculateSubtotal();
  const { taxableAmount, taxAmount } = calculateTaxDetails();
  const nonTaxableAmount = calculateNonTaxableAmount();
  const totalAmount = subtotal + taxAmount;

  const handleDeleteItem = async (itemName, isCombo = false) => {
    if (currentOrder.status === 'completed') {
      Alert.alert('Error', 'This order has been paid and cannot be modified');
      return;
    }

    try {
      const updatedItems = isCombo 
        ? currentOrder.items
        : currentOrder.items.filter(item => item.orderproductname !== itemName);
      
      const updatedCombos = isCombo
        ? currentOrder.comboItems.filter(combo => combo.comboproductitem !== itemName)
        : currentOrder.comboItems;
      
      const response = await fetch(
        `http://192.168.212.66:3000/api/order/update-order/${currentOrder.ordernumber}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderitems: updatedItems,
            ordercomboitem: updatedCombos
          }),
        }
      );
      
      if (response.ok) {
        setCurrentOrder(prev => ({
          ...prev,
          items: updatedItems,
          comboItems: updatedCombos,
          updatedAt: new Date().toISOString()
        }));
      } else {
        const result = await response.json();
        Alert.alert('Error', result.message || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', 'An error occurred while removing the item');
    }
  };

  const handleAddMoreItems = () => {
    if (currentOrder.status === 'completed') {
      Alert.alert('Error', 'This order has been paid and cannot be modified');
      return;
    }
    
    router.navigate({
      pathname: '/add-order/Order',
      params: {
        tableId,
        tableName,
        existingOrder: JSON.stringify({
          ordernumber: currentOrder.ordernumber,
          items: currentOrder.items,
          comboItems: currentOrder.comboItems
        })
      }
    });
  };

  const handlePay = async () => {
    try {
      const response = await fetch(
        `http://192.168.212.66:3000/api/order/update-order-totals/${currentOrder.ordernumber}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subtotal,
            taxableAmount,
            taxAmount,
            ordertotal: totalAmount,
            status: 'completed'
          }),
        }
      );
  
      if (response.ok) {
        setCurrentOrder({
          ordernumber: '',
          items: [],
          comboItems: [],
          createdAt: new Date().toISOString(),
          status: 'pending'
        });
        
        router.setParams({ 
          tableName,
          tableId,
          orderDetails: undefined
        });
        
        await fetchData();
        setActiveTab('history');
        Alert.alert('Success', 'Payment processed successfully');
      } else {
        const result = await response.json();
        Alert.alert('Error', result.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'An error occurred during payment');
    }
  };

  const renderOrderItem = (item, isCombo = false, index) => {
    const getChosenItems = () => {
      if (!isCombo || !item.combochooseitems) return [];
      
      const itemMap = new Map();
      
      item.combochooseitems.forEach(choice => {
        let itemName;
        let quantity = 1;
        
        if (typeof choice === 'string') {
          itemName = choice;
        } else {
          if (choice.combochooseitemname) itemName = choice.combochooseitemname;
          else if (choice.productname) itemName = choice.productname;
          else if (choice.name) itemName = choice.name;
          else if (choice.itemName) itemName = choice.itemName;
          else if (choice.productId) {
            const product = products.find(p => p._id === choice.productId);
            itemName = product?.productname || 'Unknown Item';
          }
          else itemName = 'Unknown Item';
          
          if (choice.chooseitemquantity || choice.combochooseitemquantity) {
            quantity = choice.chooseitemquantity || choice.combochooseitemquantity;
          }
        }
        
        if (itemMap.has(itemName)) {
          itemMap.set(itemName, itemMap.get(itemName) + quantity);
        } else {
          itemMap.set(itemName, quantity);
        }
      });
      
      return Array.from(itemMap.entries()).map(([name, quantity]) => ({
        name,
        quantity
      }));
    };
    
    const chosenItems = getChosenItems();
    const itemName = isCombo ? item.comboproductname || item.comboproductitem : item.orderproductname;
    const quantity = isCombo ? item.comboproductquantity : item.orderproductquantity;
    const price = isCombo ? item.comboproductprice : item.orderproductprice;
    const taxRate = isCombo ? item.comboproducttax : item.orderproducttax;
    const totalPrice = (price || 0) * (quantity || 0);
  
    return (
      <View 
        key={`${isCombo ? 'combo-' : 'item-'}-${index}`}
        className={`flex-row justify-between mb-2 pb-2 border-b border-gray-100`}
      >
        <View className="flex-1">
          <Text className="text-base font-medium">
            {isCombo ? `${itemName} (Combo)` : itemName}
          </Text>
          <Text className="text-sm text-gray-500">
            x{quantity} • {taxRate > 0 ? ` Tax: ${taxRate}%` : ' No Tax'}
          </Text>
          
          {isCombo && chosenItems.length > 0 && (
            <View className="mt-1">
              <Text className="text-xs text-gray-500">Includes:</Text>
              {chosenItems.map((chosenItem, idx) => (
                <Text key={`chosen-${idx}`} className="text-xs text-gray-500 ml-2">
                  • {chosenItem.name} {chosenItem.quantity > 1 ? `x${chosenItem.quantity}` : ''}
                </Text>
              ))}
            </View>
          )}
        </View>
        <View className="flex-row items-center">
          <Text className="text-base font-bold mr-4">
            RM {totalPrice.toFixed(2)}
          </Text>
          {currentOrder.status !== 'completed' && (
            <TouchableOpacity 
              onPress={() => handleDeleteItem(itemName, isCombo)}
              className="bg-red-500 px-2 py-1 rounded"
            >
              <Text className="text-white">Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderCurrentOrder = () => {
    if (!currentOrder.ordernumber) {
      return (
        <View className="flex-1 justify-center items-center p-4">
          <MaterialIcons name="shopping-cart" size={60} color="#6b7280" />
          <Text className="text-xl font-bold mt-4 text-center">
            No active order
          </Text>
          <Text className="text-gray-500 mt-1 text-center">
            Start by selecting a table to create an order
          </Text>
          
          <TouchableOpacity 
            onPress={() => router.navigate('(tab)/Table')} // Changed to navigate to tables page
            className="mt-6 bg-blue-500 px-6 py-3 rounded"
          >
            <Text className="text-white font-medium">Select Table</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View className="flex-1">
        <ScrollView 
          className="flex-1 bg-white p-4"
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchData}
            />
          }
        >
          <View className="mb-5 border-b border-gray-200 pb-2.5">
            <Text className="text-2xl font-bold text-center">Order Bill</Text>
            <Text className="text-lg text-center mt-1 text-gray-600">Table: {tableName}</Text>
          </View>
    
          <View className="mb-5">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold">Order #{currentOrder.ordernumber || ''}</Text>
              <Text className="text-sm text-blue-600">
                {currentOrder.status}
              </Text>
            </View>
            
            <Text className="text-gray-500 mb-2.5">
              {new Date(currentOrder.updatedAt || currentOrder.createdAt).toLocaleString()}
            </Text>
          </View>
    
          <View className="mb-5">
            <Text className="text-lg font-bold mb-2.5">Items:</Text>
            {currentOrder.items?.length === 0 && currentOrder.comboItems?.length === 0 ? (
              <Text className="text-gray-500">No items in this order</Text>
            ) : (
              <>
                {currentOrder.items?.map((item, index) => renderOrderItem(item, false, index))}
                {currentOrder.comboItems?.map((combo, index) => renderOrderItem(combo, true, index))}
              </>
            )}
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
        </ScrollView>
    
        {currentOrder.status !== 'completed' && (
          <View className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-200">
            <View className="flex-row justify-between">
              <TouchableOpacity 
                onPress={handleAddMoreItems}
                className="bg-blue-500 px-4 py-3 rounded flex-1 mr-2"
              >
                <Text className="text-white text-center font-medium">Add More Items</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handlePay}
                className="bg-green-500 px-4 py-3 rounded flex-1 ml-2"
              >
                <Text className="text-white text-center font-medium">Pay Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderAllOrders = () => (
    <ScrollView 
      className="flex-1 bg-white p-4"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={fetchData}
        />
      }
    >
      <Text className="text-2xl font-bold mb-4">All Orders</Text>
      
      {allOrders.length === 0 ? (
        <Text className="text-gray-500">No orders found</Text>
      ) : (
        allOrders.map((order) => (
          <TouchableOpacity
            key={`order-${order.ordernumber}`}
            className="mb-4 border border-gray-300 p-3 rounded-lg"
            onPress={() => {
              if (order.status === 'completed') return;
              
              setCurrentOrder({
                ordernumber: order.ordernumber,
                items: order.orderitems || [],
                comboItems: order.ordercomboitem || [],
                createdAt: order.createdAt,
                status: order.status,
                updatedAt: order.updatedAt
              });
              setActiveTab('current');
            }}
          >
            <View className="flex-row justify-between">
              <Text className="font-bold">Order #{order.ordernumber}</Text>
              <Text className={`font-bold ${
                order.status === 'completed' ? 'text-green-600' : 
                order.status === 'cancelled' ? 'text-red-600' : 'text-blue-600'
              }`}>
                {order.status}
              </Text>
            </View>
            <Text className="text-gray-500 text-sm">
              {new Date(order.createdAt).toLocaleString()}
            </Text>
            
            {order.table && (
              <Text className="mt-1">
                Table: {typeof order.table === 'object' ? order.table.tablename : order.table}
              </Text>
            )}
            
            <Text className="mt-1">Total: RM {order.ordertotal?.toFixed(2) || '0.00'}</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <View className="flex-row border-b border-gray-200">
        <TouchableOpacity
          className={`flex-1 py-3 items-center ${activeTab === 'current' ? 'border-b-2 border-blue-500' : ''}`}
          onPress={() => setActiveTab('current')}
        >
          <View className="flex-row items-center">
            <MaterialIcons 
              name="shopping-cart" 
              size={20} 
              color={activeTab === 'current' ? '#3b82f6' : '#6b7280'} 
            />
            <Text 
              className={`ml-2 ${activeTab === 'current' ? 'text-blue-500 font-bold' : 'text-gray-500'}`}
            >
              Current Order
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          className={`flex-1 py-3 items-center ${activeTab === 'history' ? 'border-b-2 border-blue-500' : ''}`}
          onPress={() => setActiveTab('history')}
        >
          <View className="flex-row items-center">
            <MaterialIcons 
              name="list-alt" 
              size={20} 
              color={activeTab === 'history' ? '#3b82f6' : '#6b7280'} 
            />
            <Text 
              className={`ml-2 ${activeTab === 'history' ? 'text-blue-500 font-bold' : 'text-gray-500'}`}
            >
              Order History
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View className="flex-1">
        {activeTab === 'current' ? renderCurrentOrder() : renderAllOrders()}
      </View>
    </View>
  );
}