import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Picker } from '@react-native-picker/picker';

export default function Cart() {
  const params = useLocalSearchParams();
  const { tableName, orderDetails, tableId } = params || {};
  
  const [currentOrder, setCurrentOrder] = useState({
    ordernumber: '',
    items: [],
    comboItems: [],
    createdAt: new Date().toISOString(),
    status: 'pending',
    table: tableName || ''
  });

  const [allOrders, setAllOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('current');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState('CASH');

  const API_BASE_URL = 'http://192.168.208.66:3000'


  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/product/get-products`);
      const data = await response.json();
      if (response.ok) setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/order/get-orders`);
      const data = await response.json();
      if (response.ok) setAllOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      await Promise.all([fetchProducts(), fetchOrders()]);

      if (currentOrder.ordernumber) {
        const orderResponse = await fetch(
          `${API_BASE_URL}/api/order/get-order/${currentOrder.ordernumber}`
        );
        
        if (orderResponse.ok) {
          const orderData = await orderResponse.json();
          const updatedOrder = orderData.order;
          
          setCurrentOrder(prev => ({
            ...prev,
            items: updatedOrder.orderitems || [],
            comboItems: updatedOrder.ordercomboitem || [],
            status: updatedOrder.status,
            updatedAt: updatedOrder.updatedAt,
            table: updatedOrder.table?.tablename || tableName || ''
          }));
          
          if (updatedOrder.status === 'completed') {
            router.setParams({ 
              tableName: updatedOrder.table?.tablename || tableName,
              tableId,
              orderDetails: undefined
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [currentOrder.ordernumber, tableName, tableId]);

  useEffect(() => {
    let intervalId;
    
    const setupPolling = () => {
      fetchData();
      if (currentOrder.status !== 'completed') {
        intervalId = setInterval(fetchData, 10000);
      }
    };
    
    setupPolling();
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchData, currentOrder.status]);

  useEffect(() => {
    if (!orderDetails || orderDetails === 'null' || orderDetails === 'undefined') {
      return;
    }

    try {
      const parsed = JSON.parse(orderDetails);
      if (!parsed) return;

      if (parsed.status !== 'completed') {
        const processOrderItems = (items) => {
          return items?.map(item => {
            const product = products.find(p => p.productname === item.orderproductname);
            return {
              ...item,
              orderproducttax: product?.producttax ?? item.orderproducttax
            };
          }) || [];
        };

        const processComboItems = (combos) => {
          return combos?.map(combo => {
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
        };

        setCurrentOrder(prev => ({
          ...prev,
          ordernumber: parsed.ordernumber || '',
          items: processOrderItems(parsed.items),
          comboItems: processComboItems(parsed.comboItems),
          createdAt: parsed.createdAt || new Date().toISOString(),
          status: parsed.status || 'pending',
          updatedAt: parsed.updatedAt || new Date().toISOString(),
          table: parsed.table?.tablename || tableName || ''
        }));
      }
    } catch (error) {
      console.error('Error parsing order details:', error);
      setCurrentOrder(prev => ({
        ...prev,
        ordernumber: '',
        items: [],
        comboItems: [],
        createdAt: new Date().toISOString(),
        status: 'pending',
        table: tableName || ''
      }));
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
      
      setCurrentOrder(prev => ({
        ...prev,
        items: updatedItems,
        comboItems: updatedCombos,
        updatedAt: new Date().toISOString()
      }));

      const response = await fetch(
        `${API_BASE_URL}/api/order/update-order/${currentOrder.ordernumber}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderitems: updatedItems,
            ordercomboitem: updatedCombos
          }),
        }
      );
      
      if (!response.ok) {
        const result = await response.json();
        Alert.alert('Error', result.message || 'Failed to remove item');
        fetchData();
      } else {
        const updatedOrder = await response.json();
        setCurrentOrder({
          ...updatedOrder.order,
          items: updatedOrder.order.orderitems || [],
          comboItems: updatedOrder.order.ordercomboitem || [],
          table: updatedOrder.order.table?.tablename || tableName || ''
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', 'An error occurred while removing the item');
      fetchData();
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
        tableName: currentOrder.table || tableName,
        existingOrder: JSON.stringify({
          ordernumber: currentOrder.ordernumber,
          items: currentOrder.items,
          comboItems: currentOrder.comboItems,
          table: currentOrder.table || tableName
        })
      }
    });
  };

  const handlePay = async () => {
    setShowPaymentModal(true);
  };

  const confirmPayment = async () => {
    try {
      setShowPaymentModal(false);
      
      const response = await fetch(
        `${API_BASE_URL}/api/order/update-order-totals/${currentOrder.ordernumber}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subtotal,
            taxableAmount,
            taxAmount,
            ordertotal: totalAmount,
            status: 'completed',
            paymentType: paymentType
          }),
        }
      );

      if (response.ok) {
        await fetchData();
        
        setCurrentOrder(prev => ({
          ...prev,
          status: 'completed'
        }));
        
        router.setParams({ 
          tableName: currentOrder.table || tableName,
          tableId,
          orderDetails: undefined
        });
        
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
          
          quantity = choice.chooseitemquantity || 
                   choice.combochooseitemquantity || 
                   choice.quantity || 
                   1;
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
    if (currentOrder.status === 'completed') {
      return (
        <View className="flex-1 justify-center items-center p-4">
          <MaterialIcons name="check-circle" size={60} color="#10B981" />
          <Text className="text-xl font-bold mt-4 text-center">
            Order #{currentOrder.ordernumber} Completed
          </Text>
          <Text className="text-gray-500 mt-1 text-center">
            Total: RM {totalAmount.toFixed(2)}
          </Text>
          <Text className="text-gray-500 text-center">
            {new Date(currentOrder.updatedAt).toLocaleString()}
          </Text>
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
            <Text className="text-lg text-center mt-1 text-gray-600">
              Table: {currentOrder.table || tableName || 'No table assigned'}
            </Text>
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
          <View
            key={`order-${order.ordernumber}`}
            className="mb-4 border border-gray-300 p-3 rounded-lg"
          >
            <TouchableOpacity
              onPress={() => {
                if (order.status === 'completed') return;
                
                setCurrentOrder({
                  ordernumber: order.ordernumber,
                  items: order.orderitems || [],
                  comboItems: order.ordercomboitem || [],
                  createdAt: order.createdAt,
                  status: order.status,
                  updatedAt: order.updatedAt,
                  table: order.table?.tablename || tableName || ''
                });
                
                router.setParams({
                  tableName: order.table?.tablename || tableName,
                  tableId,
                  orderDetails: JSON.stringify({
                    ordernumber: order.ordernumber,
                    items: order.orderitems,
                    comboItems: order.ordercomboitem,
                    status: order.status,
                    table: order.table
                  })
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
            </TouchableOpacity>
            
            {/* Display Order Items */}
            <View className="mt-2 pt-2 border-t border-gray-200">
              <Text className="font-medium mb-1">Items:</Text>
              {order.orderitems?.length === 0 && order.ordercomboitem?.length === 0 ? (
                <Text className="text-gray-500 text-sm">No items in this order</Text>
              ) : (
                <>
                  {order.orderitems?.map((item, index) => (
                    <View key={`item-${index}`} className="flex-row justify-between mb-1">
                      <Text className="text-sm">
                        {item.orderproductname} x{item.orderproductquantity}
                      </Text>
                      <Text className="text-sm">
                        RM {(item.orderproductprice * item.orderproductquantity).toFixed(2)}
                      </Text>
                    </View>
                  ))}
                  
                  {order.ordercomboitem?.map((combo, index) => (
                    <View key={`combo-${index}`} className="mb-1">
                      <View className="flex-row justify-between">
                        <Text className="text-sm">
                          {combo.comboproductname || combo.comboproductitem} (Combo) x{combo.comboproductquantity}
                        </Text>
                        <Text className="text-sm">
                          RM {(combo.comboproductprice * combo.comboproductquantity).toFixed(2)}
                        </Text>
                      </View>
                      {combo.combochooseitems?.length > 0 && (
                        <View className="ml-2 mt-1">
                          <Text className="text-xs text-gray-500">Includes:</Text>
                          {combo.combochooseitems.map((choice, idx) => {
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
                              } else {
                                itemName = 'Unknown Item';
                              }
                              
                              quantity = choice.chooseitemquantity || 
                                        choice.combochooseitemquantity || 
                                        choice.quantity || 
                                        1;
                            }
                            
                            return (
                              <Text key={`choice-${idx}`} className="text-xs text-gray-500 ml-1">
                                • {itemName} {quantity > 1 ? `x${quantity}` : ''}
                              </Text>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  ))}
                </>
              )}
            </View>
            
            <View className="mt-2 pt-2 border-t border-gray-200">
              <View className="flex-row justify-between">
                <Text className="font-medium">Total:</Text>
                <Text className="font-bold">
                  RM {order.ordertotal?.toFixed(2) || '0.00'}
                </Text>
              </View>
              {order.paymentType && (
                <View className="flex-row justify-between mt-1">
                  <Text className="text-sm text-gray-500">Payment Method:</Text>
                  <Text className="text-sm text-gray-500">
                    {order.paymentType === 'CASH' ? 'Cash' : 
                     order.paymentType === 'VISA' ? 'Visa' :
                     order.paymentType === 'MASTER' ? 'MasterCard' :
                     order.paymentType === 'EWALLET-TNG' ? "Touch 'n Go" :
                     order.paymentType === 'DUITNOW' ? 'DuitNow' :
                     order.paymentType === 'BANK-TRANSFER' ? 'Bank Transfer' : 'Other'}
                  </Text>
                </View>
              )}
            </View>
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
      {/* Payment Type Modal */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white p-5 rounded-lg w-80">
            <Text className="text-lg font-bold mb-4">Select Payment Method</Text>
            
            <Picker
              selectedValue={paymentType}
              onValueChange={(itemValue) => setPaymentType(itemValue)}
              style={{ height: 50, width: '100%' }}
            >
              <Picker.Item label="Cash" value="CASH" />
              <Picker.Item label="Visa" value="VISA" />
              <Picker.Item label="MasterCard" value="MASTER" />
              <Picker.Item label="Touch 'n Go eWallet" value="EWALLET-TNG" />
              <Picker.Item label="DuitNow" value="DUITNOW" />
              <Picker.Item label="Bank Transfer" value="BANK-TRANSFER" />
              <Picker.Item label="Other" value="OTHER" />
            </Picker>
            
            <View className="flex-row justify-between mt-4">
              <TouchableOpacity 
                onPress={() => setShowPaymentModal(false)}
                className="bg-gray-500 px-4 py-2 rounded"
              >
                <Text className="text-white">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={confirmPayment}
                className="bg-green-500 px-4 py-2 rounded"
              >
                <Text className="text-white">Confirm Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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