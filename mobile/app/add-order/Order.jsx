import { View, Text, FlatList, TouchableOpacity, Image, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';

export default function Order() {
  const [products, setProducts] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [orderItems, setOrderItems] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch products and subcategories
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch('http://192.168.212.66:3000/api/product/get-products');
        const data = await res.json();
        if (res.ok) {
          setProducts(data);
          
          // Extract unique subcategories with proper null checks
          const uniqueSubs = {};
          data.forEach(product => {
            if (product?.productsub && typeof product.productsub === 'object' && product.productsub !== null && product.productsub._id) {
              uniqueSubs[product.productsub._id] = product.productsub;
            }
          });
          setSubCategories(Object.values(uniqueSubs));
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products by selected subcategory with null check
  const filteredProducts = selectedSubCategory 
    ? products.filter(product => 
        product?.productsub && product.productsub._id === selectedSubCategory._id
      )
    : [];

  // Handle quantity changes
  const handleQuantityChange = (productId, change) => {
    setOrderItems(prev => {
      const currentQuantity = prev[productId] || 0;
      const newQuantity = currentQuantity + change;
      
      if (newQuantity < 0) return prev; // Prevent negative quantities
      
      return {
        ...prev,
        [productId]: newQuantity
      };
    });
  };

  // Render product item
  const renderProductItem = ({ item }) => (
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

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading products...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 flex-row bg-white">
      {/* Subcategories List (Left Side) */}
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

      {/* Products List (Right Side) */}
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
  );
}