import { View, Text, FlatList, TouchableOpacity, Image, ScrollView, Modal, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRoute } from '@react-navigation/native';
import { router } from 'expo-router';

export default function Order() {
  const route = useRoute();
  const { tableId, tableName, existingOrder } = route.params || {};
  
  // State declarations
  const [products, setProducts] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [orderItems, setOrderItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [combos, setCombos] = useState([]);
  const [selectedCombo, setSelectedCombo] = useState(null);
  const [showComboModal, setShowComboModal] = useState(false);
  const [currentComboAction, setCurrentComboAction] = useState(null);
  const [selectedComboChoices, setSelectedComboChoices] = useState([]);

  const API_BASE_URL = 'http://192.168.208.66:3000'


  // Fetch products and combos data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [productsRes, combosRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/product/get-products`),
          fetch(`${API_BASE_URL}/api/combo/get-combos`)
        ]);
        
        const [productsData, combosData] = await Promise.all([
          productsRes.json(),
          combosRes.json()
        ]);
        
        if (productsRes.ok && combosRes.ok) {
          setProducts(productsData);
          setCombos(combosData);
          
          // Extract unique subcategories
          const uniqueSubs = {};
          productsData.forEach(product => {
            if (product?.productsub) {
              uniqueSubs[product.productsub._id] = product.productsub;
            }
          });
          setSubCategories(Object.values(uniqueSubs));
          
          // Initialize with existing order if provided
          if (existingOrder) {
            initializeExistingOrder(productsData, combosData);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load menu data');
      } finally {
        setLoading(false);
      }
    };

    const initializeExistingOrder = (productsData, combosData) => {
      const parsedOrder = JSON.parse(existingOrder);
      const newOrderItems = {};
      
      // Process regular items
      parsedOrder.items.forEach(item => {
        const product = productsData.find(p => p.productname === item.orderproductname);
        if (product) {
          newOrderItems[product._id] = item.orderproductquantity;
        }
      });
      
      // Process combo items with grouping
      parsedOrder.comboItems.forEach(combo => {
        const comboData = combosData.find(c => 
          c.comboName.productname === combo.comboproductitem
        );
        if (comboData) {
          const comboKey = `combo_${comboData._id}`;
          
          // Group combo selections by groupIndex
          const groups = {};
          combo.combochooseitems.forEach(item => {
            const groupIndex = item.groupIndex || 0;
            if (!groups[groupIndex]) {
              groups[groupIndex] = [];
            }
            groups[groupIndex].push({
              name: item.combochooseitemname,
              quantity: item.combochooseitemquantity
            });
          });
          
          newOrderItems[comboKey] = {
            comboId: comboData._id,
            comboName: comboData.comboName.productname,
            price: Number(combo.comboproductprice),
            quantity: combo.comboproductquantity,
            selectionGroups: Object.values(groups)
          };
        }
      });
      
      setOrderItems(newOrderItems);
    };

    fetchData();
  }, [existingOrder]);

  // Filter products by selected subcategory
  const filteredProducts = selectedSubCategory 
    ? products.filter(product => 
        product?.productsub?._id === selectedSubCategory._id
      )
    : [];

  // Handle regular product quantity changes
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

  // Handle combo selection
  const handleComboPress = (combo) => {
    setSelectedCombo(combo);
    setCurrentComboAction('new');
    setSelectedComboChoices([]);
    setShowComboModal(true);
  };

  // Update combo quantity with proper grouping
  const updateComboQuantity = (comboKey, change) => {
    setOrderItems(prev => {
      const currentItem = prev[comboKey];
      
      // If combo doesn't exist, show modal for new selection
      if (!currentItem) {
        const combo = combos.find(c => `combo_${c._id}` === comboKey);
        if (combo) {
          setSelectedCombo(combo);
          setCurrentComboAction('new');
          setSelectedComboChoices([]);
          setShowComboModal(true);
        }
        return prev;
      }

      // Handle quantity increase
      if (change > 0) {
        const combo = combos.find(c => c._id === currentItem.comboId);
        if (combo) {
          setSelectedCombo(combo);
          setCurrentComboAction('add');
          setSelectedComboChoices([]);
          setShowComboModal(true);
        }
        return prev;
      } 
      // Handle quantity decrease
      else {
        const newQuantity = currentItem.quantity + change;
        
        // Remove if quantity reaches zero
        if (newQuantity <= 0) {
          const newItems = {...prev};
          delete newItems[comboKey];
          return newItems;
        }
        
        // Keep only the first N selection groups
        return {
          ...prev,
          [comboKey]: {
            ...currentItem,
            quantity: newQuantity,
            selectionGroups: currentItem.selectionGroups.slice(0, newQuantity)
          }
        };
      }
    });
  };

  // Finalize combo selection
  const handleComboItemSelect = (comboId, selections) => {
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
        selectionGroups: []
      };

      // Add new selection group
      if (currentComboAction === 'add') {
        return {
          ...prev,
          [comboKey]: {
            ...currentItem,
            quantity: currentItem.quantity + 1,
            selectionGroups: [
              ...currentItem.selectionGroups,
              selections
            ]
          }
        };
      } 
      // Create new combo with initial selection
      else {
        return {
          ...prev,
          [comboKey]: {
            ...currentItem,
            quantity: 1,
            selectionGroups: [selections]
          }
        };
      }
    });
  };

  // Check if order has items
  const hasOrderItems = Object.values(orderItems).some(item => {
    if (typeof item === 'number') return item > 0;
    if (typeof item === 'object') return item.quantity > 0;
    return false;
  });

  // Submit order to server
  const handleOrder = async () => {
    if (!hasOrderItems) {
      Alert.alert('Empty Order', 'Please add items to your order before proceeding.');
      return;
    }

    try {
      const orderData = prepareOrderData();
      const { endpoint, method } = getOrderEndpoint();

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (response.ok) {
        navigateToBillScreen(result);
      } else {
        Alert.alert('Error', result.message || 'Failed to process order');
      }
    } catch (error) {
      console.error('Order submission error:', error);
      Alert.alert('Error', 'An error occurred while processing the order');
    }
  };

  const prepareOrderData = () => {
    const orderData = {
      table: tableId,
      orderitems: [],
      ordercomboitem: []
    };

    Object.entries(orderItems).forEach(([key, value]) => {
      if (!key.startsWith('combo_')) {
        processRegularItem(orderData, key, value);
      } else {
        processComboItem(orderData, value);
      }
    });

    return orderData;
  };

  const processRegularItem = (orderData, key, value) => {
    const product = products.find(p => p._id === key);
    if (product && value > 0) {
      orderData.orderitems.push({
        orderproductname: product.productname,
        orderproductquantity: value,
        orderproductprice: Number(product.productprice)
      });
    }
  };

  const processComboItem = (orderData, value) => {
    if (value.quantity > 0) {
      orderData.ordercomboitem.push({
        comboproductitem: value.comboName,
        comboproductquantity: value.quantity,
        comboproductprice: value.price,
        combochooseitems: value.selectionGroups.flatMap((group, groupIndex) => 
          group.map(item => ({
            combochooseitemname: item.name,
            combochooseitemquantity: item.quantity,
            groupIndex: groupIndex
          }))
      )});
    }
  };

  const getOrderEndpoint = () => {
    return existingOrder 
      ? {
          endpoint: `${API_BASE_URL}/api/order/update-order/${JSON.parse(existingOrder).ordernumber}`,
          method: 'PUT'
        }
      : {
          endpoint: `${API_BASE_URL}/api/order/create-order`,
          method: 'POST'
        };
  };

  const navigateToBillScreen = (result) => {
    const ordernumber = existingOrder 
      ? JSON.parse(existingOrder).ordernumber 
      : result.ordernumber;
    
    router.replace({
      pathname: '/(tab)/Cart',
      params: {
        tableName,
        tableId,
        orderDetails: JSON.stringify({
          ordernumber,
          items: prepareOrderData().orderitems,
          comboItems: prepareOrderData().ordercomboitem,
          createdAt: new Date().toISOString(),
          taxRate: result.servicetax || 8
        })
      }
    });
  };

  // Render product item with proper combo handling
  const renderProductItem = ({ item }) => {
    const isCombo = item.productcategory === 'Combo';
    const comboData = isCombo ? combos.find(c => c.comboName._id === item._id) : null;
    
    if (isCombo && comboData) {
      return <ComboItem 
        item={item} 
        comboData={comboData} 
        orderItems={orderItems} 
        updateComboQuantity={updateComboQuantity} 
      />;
    }
    
    return <RegularItem 
      item={item} 
      orderItems={orderItems} 
      handleQuantityChange={handleQuantityChange} 
    />;
  };

  // Loading state
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading menu...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-[#006b7e] p-4">
        <Text className="text-white text-center text-lg font-bold">
          Table: {tableName || 'No table selected'}
        </Text>
      </View>

      {/* Main content */}
      <View className="flex-1 flex-row">
        {/* Subcategories sidebar */}
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

        {/* Products list */}
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

      {/* Order button */}
      <TouchableOpacity
        className={`p-4 items-center ${hasOrderItems ? 'bg-[#006b7e]' : 'bg-gray-400'}`}
        onPress={handleOrder}
        disabled={!hasOrderItems}
      >
        <Text className="text-white text-lg font-bold">Proceed Order</Text>
      </TouchableOpacity>

      {/* Combo selection modal */}
      <ComboSelectionModal
        showComboModal={showComboModal}
        selectedCombo={selectedCombo}
        selectedComboChoices={selectedComboChoices}
        setSelectedComboChoices={setSelectedComboChoices}
        setShowComboModal={setShowComboModal}
        handleComboItemSelect={handleComboItemSelect}
      />
    </View>
  );
}

// Component for regular menu item
const RegularItem = ({ item, orderItems, handleQuantityChange }) => (
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

// Component for combo menu item
const ComboItem = ({ item, comboData, orderItems, updateComboQuantity }) => {
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
        
        {/* Display selection groups */}
        {comboInOrder?.selectionGroups?.map((group, groupIndex) => (
          <View key={groupIndex} className="mb-2">
            <Text className="text-xs text-gray-500">Set {groupIndex + 1}:</Text>
            {group.map((selection, idx) => (
              <Text key={idx} className="text-xs text-gray-500 ml-2">
                • {selection.name} (x{selection.quantity})
              </Text>
            ))}
          </View>
        ))}
        
        {/* Quantity controls */}
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
};

// Component for combo selection modal
const ComboSelectionModal = ({
  showComboModal,
  selectedCombo,
  selectedComboChoices,
  setSelectedComboChoices,
  setShowComboModal,
  handleComboItemSelect
}) => (
  <Modal
    visible={showComboModal}
    animationType="slide"
    transparent={false}
    onRequestClose={() => {
      setSelectedComboChoices([]);
      setShowComboModal(false);
    }}
  >
    <View className="flex-1 p-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xl font-bold">
          {selectedCombo?.comboName?.productname || 'Combo Options'}
        </Text>
        <TouchableOpacity onPress={() => {
          setSelectedComboChoices([]);
          setShowComboModal(false);
        }}>
          <Text className="text-lg text-[#006b7e]">Close</Text>
        </TouchableOpacity>
      </View>
      
      <Text className="mb-4">
        Select {selectedCombo?.chooseNumber} of {selectedCombo?.option} options:
        {selectedComboChoices.length > 0 && (
          <Text className="text-green-600"> ({selectedComboChoices.length} selected)</Text>
        )}
      </Text>
      
      {selectedCombo?.productDetails?.map((detail, index) => {
        const isSelected = selectedComboChoices.some(
          choice => choice.name === detail.productname
        );
        
        return (
          <TouchableOpacity
            key={index}
            className={`p-3 mb-2 border rounded ${
              isSelected ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-300'
            }`}
            onPress={() => {
              if (isSelected) {
                setSelectedComboChoices(prev =>
                  prev.filter(choice => choice.name !== detail.productname)
                );
              } else {
                if (selectedComboChoices.length < selectedCombo.chooseNumber) {
                  setSelectedComboChoices(prev => [
                    ...prev,
                    { 
                      name: detail.productname, 
                      quantity: detail.comboquantity 
                    }
                  ]);
                } else {
                  Alert.alert(
                    "Maximum selections reached",
                    `You can only choose ${selectedCombo.chooseNumber} options.`
                  );
                }
              }
            }}
          >
            <Text className="text-base font-bold">{detail.productname}</Text>
            <Text className="text-sm text-gray-600">Quantity: {detail.comboquantity}</Text>
          </TouchableOpacity>
        );
      })}
      
      {selectedComboChoices.length === selectedCombo?.chooseNumber && (
        <TouchableOpacity
          className="mt-4 p-3 bg-[#006b7e] rounded items-center"
          onPress={() => {
            handleComboItemSelect(
              selectedCombo._id,
              selectedComboChoices
            );
            setSelectedComboChoices([]);
            setShowComboModal(false);
          }}
        >
          <Text className="text-white font-bold">Confirm Selection</Text>
        </TouchableOpacity>
      )}
    </View>
  </Modal>
);