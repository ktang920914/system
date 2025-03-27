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

  // Fetch all necessary data
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
    const response = await fetch('http://192.168.212.66:3000/api/product/get-products');
    const data = await response.json();
    if (response.ok) setProducts(data);
  };

  const fetchOrders = async () => {
    const response = await fetch('http://192.168.212.66:3000/api/order/get-orders');
    const data = await response.json();
    if (response.ok) setAllOrders(data.orders || []);
  };

  // Parse and set current order details
  useEffect(() => {
    if (orderDetails && products.length > 0) {
      try {
        const parsed = JSON.parse(orderDetails);
        
        const matchedItems = parsed.items?.map(item => {
          const product = products.find(p => p.productname === item.orderproductname);
          return {
            ...item,
            orderproducttax: product?.producttax ?? item.orderproducttax
          };
        }) || [];

        const matchedComboItems = parsed.comboItems?.map(combo => {
          const product = products.find(p => p.productname === combo.comboproductitem);
          return {
            ...combo,
            comboproducttax: product?.producttax ?? combo.comboproducttax
          };
        }) || [];

        setCurrentOrder({
          ordernumber: parsed.ordernumber || '',
          items: matchedItems,
          comboItems: matchedComboItems,
          createdAt: parsed.createdAt || new Date().toISOString(),
          status: parsed.status || 'pending'
        });
      } catch (error) {
        console.error('Error parsing order details:', error);
      }
    }
  }, [orderDetails, products]);

  // Calculation functions
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

  // Order modification handlers
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
        Alert.alert('Success', 'Item removed successfully');
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
        const result = await response.json();
        setCurrentOrder(prev => ({ ...prev, status: 'completed' }));
        Alert.alert('Success', 'Payment processed successfully');
        fetchOrders(); // Refresh the orders list
      } else {
        const result = await response.json();
        Alert.alert('Error', result.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'An error occurred during payment');
    }
  };

  const renderOrderItem = (item, isCombo = false, index) => (
    <View 
      key={`${isCombo ? 'combo-' : 'item-'}-${index}`}
      className={`flex-row justify-between mb-2 pb-2 border-b border-gray-100`}
    >
      <View className="flex-1">
        <Text className="text-base">{isCombo ? `${item.comboproductitem} (Combo)` : item.orderproductname}</Text>
        <Text className="text-sm text-gray-500">
          x{isCombo ? item.comboproductquantity : item.orderproductquantity} • 
          {isCombo ? 
            (item.comboproducttax > 0 ? ` Tax: ${item.comboproducttax}%` : ' No Tax') : 
            (item.orderproducttax > 0 ? ` Tax: ${item.orderproducttax}%` : ' No Tax')
          }
        </Text>
      </View>
      <View className="flex-row items-center">
        <Text className="text-base font-bold mr-4">
          RM {((isCombo ? item.comboproductprice : item.orderproductprice || 0) * 
              (isCombo ? item.comboproductquantity : item.orderproductquantity || 0)).toFixed(2)}
        </Text>
        {currentOrder.status !== 'completed' && (
          <TouchableOpacity 
            onPress={() => handleDeleteItem(isCombo ? item.comboproductitem : item.orderproductname, isCombo)}
            className="bg-red-500 px-2 py-1 rounded"
          >
            <Text className="text-white">Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderCurrentOrder = () => (
    <View className="flex-1">
      {/* Main scrollable content */}
      <ScrollView 
        className="flex-1 bg-white p-4"
        contentContainerStyle={{ paddingBottom: 100 }} // Add extra padding at bottom
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchData}
          />
        }
      >
        {/* Current Order Section */}
        <View className="mb-5 border-b border-gray-200 pb-2.5">
          <Text className="text-2xl font-bold text-center">Order Bill</Text>
          <Text className="text-lg text-center mt-1 text-gray-600">Table: {tableName}</Text>
        </View>
  
        <View className="mb-5">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold">Order #{currentOrder.ordernumber || ''}</Text>
            <Text className={`text-sm ${
              currentOrder.status === 'completed' ? 'text-green-600' : 
              currentOrder.status === 'cancelled' ? 'text-red-600' : 'text-blue-600'
            }`}>
              {currentOrder.status}
            </Text>
          </View>
          
          <Text className="text-gray-500 mb-2.5">
            {new Date(currentOrder.updatedAt || currentOrder.createdAt).toLocaleString()}
          </Text>
        </View>
  
        <View className="mb-5">
          <Text className="text-lg font-bold mb-2.5">Items:</Text>
          {currentOrder.items?.map((item, index) => renderOrderItem(item, false, index))}
          {currentOrder.comboItems?.map((combo, index) => renderOrderItem(combo, true, index))}
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
  
      {/* Fixed buttons at bottom */}
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

  const renderAllOrders = () => (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold mb-4">All Orders</Text>
      
      {allOrders.length === 0 ? (
        <Text className="text-gray-500">No orders found</Text>
      ) : (
        allOrders.map((order) => (
          <View 
            key={`order-${order.ordernumber}`}
            className="mb-4 border border-gray-300 p-3 rounded-lg"
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
            
            {/* 显示 table 信息 */}
            {order.table && (
              <Text className="mt-1">
                Table: {typeof order.table === 'object' ? order.table.tablename : order.table}
              </Text>
            )}
            
            <Text className="mt-1">Total: RM {order.ordertotal?.toFixed(2) || '0.00'}</Text>
          </View>
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
      {/* 顶部 Tabs 导航 */}
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
              History Order
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 内容区域 */}
      <View className="flex-1">
        {activeTab === 'current' ? renderCurrentOrder() : renderAllOrders()}
      </View>
    </View>
  );
}