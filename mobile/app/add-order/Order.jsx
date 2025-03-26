import { View, Text, FlatList, TouchableOpacity, Image, ScrollView, Modal, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRoute } from '@react-navigation/native';
import { router } from 'expo-router';

export default function Order() {
  const route = useRoute();
  const { tableId, tableName, existingOrder } = route.params || {};
  
  const [products, setProducts] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [orderItems, setOrderItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [combos, setCombos] = useState([]);
  const [selectedCombo, setSelectedCombo] = useState(null);
  const [showComboModal, setShowComboModal] = useState(false);
  const [currentComboAction, setCurrentComboAction] = useState(null); // 'add' or 'new'

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [productsRes, combosRes] = await Promise.all([
          fetch('http://192.168.212.66:3000/api/product/get-products'),
          fetch('http://192.168.212.66:3000/api/combo/get-combos')
        ]);
        
        const [productsData, combosData] = await Promise.all([
          productsRes.json(),
          combosRes.json()
        ]);
        
        if (productsRes.ok && combosRes.ok) {
          setProducts(productsData);
          setCombos(combosData);
          
          const uniqueSubs = {};
          productsData.forEach(product => {
            if (product?.productsub) {
              uniqueSubs[product.productsub._id] = product.productsub;
            }
          });
          setSubCategories(Object.values(uniqueSubs));
          
          if (existingOrder) {
            const parsedOrder = JSON.parse(existingOrder);
            const newOrderItems = {};
            
            parsedOrder.items.forEach(item => {
              const product = productsData.find(p => p.productname === item.orderproductname);
              if (product) {
                newOrderItems[product._id] = item.orderproductquantity;
              }
            });
            
            parsedOrder.comboItems.forEach(combo => {
              const comboData = combosData.find(c => 
                c.comboName.productname === combo.comboproductitem
              );
              if (comboData) {
                const comboKey = `combo_${comboData._id}`;
                
                newOrderItems[comboKey] = {
                  comboId: comboData._id,
                  comboName: comboData.comboName.productname,
                  price: Number(combo.comboproductprice),
                  quantity: combo.comboproductquantity,
                  selections: combo.combochooseitems.map(item => ({
                    name: item.combochooseitemname,
                    quantity: item.combochooseitemquantity
                  }))
                };
              }
            });
            
            setOrderItems(newOrderItems);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [existingOrder]);

  const filteredProducts = selectedSubCategory 
    ? products.filter(product => 
        product?.productsub?._id === selectedSubCategory._id
      )
    : [];

  const handleQuantityChange = (productId, change) => {
    setOrderItems(prev => {
      const currentQuantity = prev[productId] || 0;
      const newQuantity = currentQuantity + change;
      
      if (newQuantity < 0) return prev;
      
      return {
        ...prev,
        [productId]: newQuantity
      };
    });
  };

  const handleComboPress = (combo) => {
    setSelectedCombo(combo);
    setCurrentComboAction('new');
    setShowComboModal(true);
  };

  const updateComboQuantity = (comboKey, change) => {
    setOrderItems(prev => {
      const currentItem = prev[comboKey];
      if (!currentItem) {
        // If no existing combo, show modal to select first item
        const combo = combos.find(c => `combo_${c._id}` === comboKey);
        if (combo) {
          setSelectedCombo(combo);
          setCurrentComboAction('new');
          setShowComboModal(true);
        }
        return prev;
      }

      if (change > 0) {
        // When increasing quantity, show modal to select new items
        const combo = combos.find(c => c._id === currentItem.comboId);
        if (combo) {
          setSelectedCombo(combo);
          setCurrentComboAction('add');
          setShowComboModal(true);
        }
        return prev;
      } else {
        const newQuantity = currentItem.quantity + change;
        
        if (newQuantity <= 0) {
          const newItems = {...prev};
          delete newItems[comboKey];
          return newItems;
        }
        
        // When decreasing quantity, remove the last selection
        return {
          ...prev,
          [comboKey]: {
            ...currentItem,
            quantity: newQuantity,
            selections: currentItem.selections.slice(0, newQuantity)
          }
        };
      }
    });
  };

  const handleComboItemSelect = (comboId, productName, quantity) => {
    const combo = combos.find(c => c._id === comboId);
    if (!combo) return;

    setShowComboModal(false);
    
    setOrderItems(prev => {
      const comboKey = `combo_${comboId}`;
      const currentItem = prev[comboKey] || {
        comboId,
        comboName: combo.comboName.productname,
        price: Number(combo.comboName.productprice),
        quantity: 0,
        selections: []
      };

      if (currentComboAction === 'add') {
        // Add to existing selections and increase quantity
        return {
          ...prev,
          [comboKey]: {
            ...currentItem,
            quantity: currentItem.quantity + 1,
            selections: [
              ...currentItem.selections,
              { name: productName, quantity }
            ]
          }
        };
      } else {
        // Create new combo item
        return {
          ...prev,
          [comboKey]: {
            ...currentItem,
            quantity: 1,
            selections: [{ name: productName, quantity }]
          }
        };
      }
    });
  };

  const hasOrderItems = Object.values(orderItems).some(item => {
    if (typeof item === 'number') return item > 0;
    if (typeof item === 'object') return item.quantity > 0;
    return false;
  });

  const handleOrder = async () => {
    if (!hasOrderItems) {
      Alert.alert('Empty Order', 'Please add items to your order before proceeding.');
      return;
    }

    try {
      const orderData = {
        table: tableId,
        orderitems: [],
        ordercomboitem: []
      };

      Object.entries(orderItems).forEach(([key, value]) => {
        if (!key.startsWith('combo_')) {
          const product = products.find(p => p._id === key);
          if (product && value > 0) {
            orderData.orderitems.push({
              orderproductname: product.productname,
              orderproductquantity: value,
              orderproductprice: Number(product.productprice)
            });
          }
        } else {
          if (value.quantity > 0) {
            // Group selections by item name and sum quantities
            const selectionMap = {};
            value.selections.forEach(selection => {
              if (!selectionMap[selection.name]) {
                selectionMap[selection.name] = 0;
              }
              selectionMap[selection.name] += selection.quantity;
            });

            const combochooseitems = Object.entries(selectionMap).map(([name, qty]) => ({
              combochooseitemname: name,
              combochooseitemquantity: qty
            }));

            orderData.ordercomboitem.push({
              comboproductitem: value.comboName,
              comboproductquantity: value.quantity,
              comboproductprice: value.price,
              combochooseitems: combochooseitems
            });
          }
        }
      });

      const endpoint = existingOrder 
        ? `http://192.168.212.66:3000/api/order/update-order/${JSON.parse(existingOrder).ordernumber}`
        : 'http://192.168.212.66:3000/api/order/create-order';

      const method = existingOrder ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (response.ok) {
        const ordernumber = existingOrder ? JSON.parse(existingOrder).ordernumber : result.ordernumber;
        
        router.replace({
          pathname: '/(tab)/Bill',
          params: {
            tableName,
            tableId,
            orderDetails: JSON.stringify({
              ordernumber,
              items: orderData.orderitems,
              comboItems: orderData.ordercomboitem,
              createdAt: new Date().toISOString(),
              taxRate: result.servicetax || 8
            })
          }
        });
      } else {
        Alert.alert('Error', result.message || 'Failed to process order');
      }
    } catch (error) {
      console.error('Order submission error:', error);
      Alert.alert('Error', 'An error occurred while processing the order');
    }
  };

  const renderProductItem = ({ item }) => {
    const isCombo = item.productcategory === 'Combo';
    const comboData = isCombo ? combos.find(c => c.comboName._id === item._id) : null;
    
    if (isCombo && comboData) {
      const comboKey = `combo_${comboData._id}`;
      const comboInOrder = orderItems[comboKey];
      
      return (
        <View className="flex-row p-2.5 border-b border-gray-200 items-center">
          <Image 
            source={require('../../../mobile/assets/images/productImage.png')} 
            className="w-20 h-20 rounded mr-3.5" 
          />
          <View className="flex-1">
            <Text className="text-base font-bold mb-1">{item.productname}</Text>
            <Text className="text-sm text-gray-600 mb-2.5">
              RM {item.productprice.toFixed(2)}
            </Text>
            
            {comboInOrder?.selections?.length > 0 && (
              <View className="mb-2">
                {comboInOrder.selections.map((selection, idx) => (
                  <Text key={idx} className="text-xs text-gray-500">
                    • {selection.name} (x{selection.quantity})
                  </Text>
                ))}
              </View>
            )}
            
            <View className="flex-row items-center">
              <TouchableOpacity 
                className="bg-[#006b7e] px-2 py-2 rounded-l min-w-[30px] items-center"
                onPress={() => updateComboQuantity(comboKey, -1)}
              >
                <Text className="text-white text-base font-bold">-</Text>
              </TouchableOpacity>
              <Text className="text-base w-[30px] text-center bg-gray-100 py-2">
                {comboInOrder?.quantity || 0}
              </Text>
              <TouchableOpacity 
                className="bg-[#006b7e] px-2 py-2 rounded-r min-w-[30px] items-center"
                onPress={() => updateComboQuantity(comboKey, 1)}
              >
                <Text className="text-white text-base font-bold">+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }
    
    return (
      <View className="flex-row p-2.5 border-b border-gray-200 items-center">
        <Image 
          source={require('../../../mobile/assets/images/productImage.png')} 
          className="w-20 h-20 rounded mr-3.5" 
        />
        <View className="flex-1">
          <Text className="text-base font-bold mb-1">{item.productname}</Text>
          <Text className="text-sm text-gray-600 mb-2.5">
            RM {item.productprice.toFixed(2)}
          </Text>
          
          <View className="flex-row items-center">
            <TouchableOpacity 
              className="bg-[#006b7e] px-2 py-2 rounded-l min-w-[30px] items-center"
              onPress={() => handleQuantityChange(item._id, -1)}
            >
              <Text className="text-white text-base font-bold">-</Text>
            </TouchableOpacity>
            <Text className="text-base w-[30px] text-center bg-gray-100 py-2">
              {orderItems[item._id] || 0}
            </Text>
            <TouchableOpacity 
              className="bg-[#006b7e] px-2 py-2 rounded-r min-w-[30px] items-center"
              onPress={() => handleQuantityChange(item._id, 1)}
            >
              <Text className="text-white text-base font-bold">+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading products...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="bg-[#006b7e] p-4">
        <Text className="text-white text-center text-lg font-bold">
          Table: {tableName || 'No table selected'}
        </Text>
      </View>

      <View className="flex-1 flex-row">
        <ScrollView className="w-[30%] bg-gray-100 border-r border-gray-300">
          {subCategories.map(sub => (
            <TouchableOpacity
              key={sub?._id || Math.random().toString()}
              className={`p-3.5 border-b border-gray-300 ${
                selectedSubCategory?._id === sub?._id ? 'bg-blue-50' : ''
              }`}
              onPress={() => setSelectedSubCategory(sub)}
            >
              <Text className="text-base">{sub?.name || 'Unnamed Category'}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View className="w-[70%]">
          {selectedSubCategory ? (
            <FlatList
              data={filteredProducts}
              renderItem={renderProductItem}
              keyExtractor={item => item?._id || Math.random().toString()}
              contentContainerStyle={{ padding: 10 }}
            />
          ) : (
            <View className="flex-1 justify-center items-center">
              <Text>Select a category to view products</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        className={`p-4 items-center ${hasOrderItems ? 'bg-[#006b7e]' : 'bg-gray-400'}`}
        onPress={handleOrder}
        disabled={!hasOrderItems}
      >
        <Text className="text-white text-lg font-bold">Proceed Order</Text>
      </TouchableOpacity>

      <Modal
        visible={showComboModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowComboModal(false)}
      >
        <View className="flex-1 p-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">
              {selectedCombo?.comboName?.productname || 'Combo Options'}
            </Text>
            <TouchableOpacity onPress={() => setShowComboModal(false)}>
              <Text className="text-lg text-[#006b7e]">Close</Text>
            </TouchableOpacity>
          </View>
          
          <Text className="mb-4">
            Select 1 of {selectedCombo?.option} options:
          </Text>
          
          {selectedCombo?.productDetails?.map((detail, index) => (
            <TouchableOpacity
              key={index}
              className="p-3 mb-2 border rounded bg-white border-gray-300"
              onPress={() => handleComboItemSelect(
                selectedCombo._id, 
                detail.productname, 
                detail.comboquantity
              )}
            >
              <Text className="text-base font-bold">{detail.productname}</Text>
              <Text className="text-sm text-gray-600">Quantity: {detail.comboquantity}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </View>
  );
}