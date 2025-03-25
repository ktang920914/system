import { View, Text, FlatList, TouchableOpacity, Image, ScrollView, Modal, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRoute } from '@react-navigation/native';
import { router } from 'expo-router';

export default function Order() {
  const route = useRoute();
  const { tableId, tableName } = route.params || {};
  
  const [products, setProducts] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [orderItems, setOrderItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [combos, setCombos] = useState([]);
  const [selectedCombo, setSelectedCombo] = useState(null);
  const [comboSelections, setComboSelections] = useState({});
  const [showComboModal, setShowComboModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const productsRes = await fetch('http://192.168.212.66:3000/api/product/get-products');
        const combosRes = await fetch('http://192.168.212.66:3000/api/combo/get-combos');
        
        const productsData = await productsRes.json();
        const combosData = await combosRes.json();
        
        if (productsRes.ok && combosRes.ok) {
          setProducts(productsData);
          setCombos(combosData);
          
          const uniqueSubs = {};
          productsData.forEach(product => {
            if (product?.productsub && typeof product.productsub === 'object' && product.productsub !== null && product.productsub._id) {
              uniqueSubs[product.productsub._id] = product.productsub;
            }
          });
          setSubCategories(Object.values(uniqueSubs));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = selectedSubCategory 
    ? products.filter(product => 
        product?.productsub && product.productsub._id === selectedSubCategory._id
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
    setShowComboModal(true);
    
    setComboSelections(prev => {
      if (!prev[combo._id]) {
        return {
          ...prev,
          [combo._id]: {}
        };
      }
      return prev;
    });
  };

  const handleComboItemSelect = (comboId, productName, quantity) => {
    setComboSelections(prev => {
      const currentSelections = prev[comboId] || {};
      
      if (currentSelections[productName]) {
        const newSelections = {...currentSelections};
        delete newSelections[productName];
        return {
          ...prev,
          [comboId]: newSelections
        };
      } else {
        const combo = combos.find(c => c._id === comboId);
        if (combo && Object.keys(currentSelections).length >= combo.chooseNumber) {
          Alert.alert(
            'Selection Limit',
            `You can only select ${combo.chooseNumber} items for this combo.`
          );
          return prev;
        }
        
        return {
          ...prev,
          [comboId]: {
            ...currentSelections,
            [productName]: quantity
          }
        };
      }
    });
  };

  const confirmComboSelection = () => {
    if (!selectedCombo) return;
    
    const currentSelections = comboSelections[selectedCombo._id] || {};
    const selectedCount = Object.keys(currentSelections).length;
    
    if (selectedCount < selectedCombo.chooseNumber) {
      Alert.alert(
        'Incomplete Selection',
        `Please select ${selectedCombo.chooseNumber} items for this combo.`
      );
      return;
    }
    
    setOrderItems(prev => ({
      ...prev,
      [`combo_${selectedCombo._id}`]: {
        comboId: selectedCombo._id,
        comboName: selectedCombo.comboName.productname,
        selections: currentSelections,
        quantity: 1,
        price: selectedCombo.comboName.productprice
      }
    }));
    
    setShowComboModal(false);
  };

  const increaseComboQuantity = (comboKey) => {
    setOrderItems(prev => {
      const currentItem = prev[comboKey];
      return {
        ...prev,
        [comboKey]: {
          ...currentItem,
          quantity: (currentItem.quantity || 1) + 1
        }
      };
    });
  };

  const decreaseComboQuantity = (comboKey) => {
    setOrderItems(prev => {
      const currentItem = prev[comboKey];
      const newQuantity = (currentItem.quantity || 1) - 1;
      
      if (newQuantity <= 0) {
        const newItems = {...prev};
        delete newItems[comboKey];
        return newItems;
      }
      
      return {
        ...prev,
        [comboKey]: {
          ...currentItem,
          quantity: newQuantity
        }
      };
    });
  };

  const hasOrderItems = Object.values(orderItems).some(item => {
    if (typeof item === 'number') return item > 0;
    if (typeof item === 'object' && item.quantity) return item.quantity > 0;
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
          if (product) {
            orderData.orderitems.push({
              orderproductname: product.productname,
              orderproductquantity: value,
              orderproductprice: product.productprice
            });
          }
        } else {
          // Find the combo data
          const combo = combos.find(c => c._id === value.comboId);
          
          // Create combo choose items array
          const combochooseitems = [];
          
          // Add selected items to combochooseitems
          Object.entries(value.selections).forEach(([productName, quantity]) => {
            const productDetail = combo.productDetails.find(
              detail => detail.productname === productName
            );
            
            if (productDetail) {
              combochooseitems.push({
                combochooseitemname: productName,
                combochooseitemquantity: productDetail.comboquantity
              });
            }
          });

          orderData.ordercomboitem.push({
            comboproductitem: value.comboName,
            comboproductquantity: value.quantity,
            comboproductprice: value.price,
            combochooseitems: combochooseitems
          });
        }
      });

      const response = await fetch('http://192.168.212.66:3000/api/order/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (response.ok) {
        router.replace({
          pathname: '/(tab)/Bill',
          params: {
            tableName,
            orderDetails: JSON.stringify({
              ordernumber: result.ordernumber,
              items: orderData.orderitems,
              comboItems: orderData.ordercomboitem,
              createdAt: new Date().toISOString(),
              taxRate: result.servicetax
            })
          }
        });
      } else {
        Alert.alert('Error', result.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Order submission error:', error);
      Alert.alert('Error', 'An error occurred while submitting the order');
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
            <Text className="text-base font-bold mb-1">{item?.productname || 'No name'}</Text>
            <Text className="text-sm text-gray-600 mb-2.5">
              RM {item?.productprice ? item.productprice.toFixed(2) : '0.00'}
            </Text>
            
            {comboInOrder?.selections && (
              <View className="mb-2">
                {Object.entries(comboInOrder.selections).map(([productName, quantity], index) => (
                  <Text key={index} className="text-xs text-gray-500">
                    • {productName} (x{quantity})
                  </Text>
                ))}
              </View>
            )}
            
            {comboInOrder ? (
              <View className="flex-row items-center">
                <TouchableOpacity 
                  className="bg-[#006b7e] px-2 py-2 rounded-l min-w-[30px] items-center"
                  onPress={() => decreaseComboQuantity(comboKey)}
                >
                  <Text className="text-white text-base font-bold">-</Text>
                </TouchableOpacity>
                <Text className="text-base w-[30px] text-center bg-gray-100 py-2">
                  {comboInOrder.quantity || 1}
                </Text>
                <TouchableOpacity 
                  className="bg-[#006b7e] px-2 py-2 rounded-r min-w-[30px] items-center"
                  onPress={() => increaseComboQuantity(comboKey)}
                >
                  <Text className="text-white text-base font-bold">+</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                className="bg-[#006b7e] px-4 py-2 rounded items-center"
                onPress={() => handleComboPress(comboData)}
              >
                <Text className="text-white text-base font-bold">Select Options</Text>
              </TouchableOpacity>
            )}
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
          <Text className="text-base font-bold mb-1">{item?.productname || 'No name'}</Text>
          <Text className="text-sm text-gray-600 mb-2.5">
            RM {item?.productprice ? item.productprice.toFixed(2) : '0.00'}
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
            Select {selectedCombo?.chooseNumber} of {selectedCombo?.option} options:
          </Text>
          
          {selectedCombo?.productDetails?.map((detail, index) => {
            const isSelected = comboSelections[selectedCombo._id]?.[detail.productname];
            return (
              <TouchableOpacity
                key={index}
                className={`p-3 mb-2 border rounded ${
                  isSelected ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-300'
                }`}
                onPress={() => handleComboItemSelect(
                  selectedCombo._id, 
                  detail.productname, 
                  detail.comboquantity
                )}
              >
                <Text className="text-base font-bold">{detail.productname}</Text>
                <Text className="text-sm text-gray-600">Quantity: {detail.comboquantity}</Text>
                {isSelected && (
                  <Text className="text-sm text-green-600 mt-1">Selected</Text>
                )}
              </TouchableOpacity>
            );
          })}
          
          <View className="mt-4">
            <Text className="mb-2">
              Selected: {Object.keys(comboSelections[selectedCombo?._id] || {}).length} / {selectedCombo?.chooseNumber}
            </Text>
            
            <TouchableOpacity
              className="bg-[#006b7e] p-3 rounded items-center"
              onPress={confirmComboSelection}
            >
              <Text className="text-white text-base font-bold">Confirm Selection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}