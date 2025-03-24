import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { useRoute } from '@react-navigation/native';

export default function Order() {
  const route = useRoute();
  const { table } = route.params;
  const [products, setProducts] = useState([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://192.168.212.66:3000/api/product/get-products');
      const data = await res.json();
      if (res.ok) {
        setProducts(data);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleSubCategoryPress = (subCategory) => {
    setSelectedSubCategory(subCategory);
  };

  const handleQuantityChange = (product, action) => {
    const updatedCart = [...cart];
    const productIndex = updatedCart.findIndex((item) => item._id === product._id);

    if (action === 'increment') {
      if (productIndex !== -1) {
        updatedCart[productIndex].quantity += 1;
      } else {
        updatedCart.push({ ...product, quantity: 1 });
      }
    } else if (action === 'decrement') {
      if (productIndex !== -1) {
        if (updatedCart[productIndex].quantity > 1) {
          updatedCart[productIndex].quantity -= 1;
        } else {
          updatedCart.splice(productIndex, 1);
        }
      }
    }

    setCart(updatedCart);
  };

  const renderProductItem = ({ item }) => (
    <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
      <Image source={{ uri: item.productimage }} className="w-16 h-16 rounded-lg" />
      <View className="flex-1 ml-4">
        <Text className="text-lg font-bold">{item.productname}</Text>
        <Text className="text-gray-700">${item.productprice.toFixed(2)}</Text>
      </View>
      <View className="flex-row items-center">
        <TouchableOpacity
          className="px-4 py-2 bg-red-200 rounded-lg"
          onPress={() => handleQuantityChange(item, 'decrement')}
        >
          <Text className="text-lg font-bold">-</Text>
        </TouchableOpacity>
        <Text className="mx-4 text-lg">{item.quantity || 0}</Text>
        <TouchableOpacity
          className="px-4 py-2 bg-green-200 rounded-lg"
          onPress={() => handleQuantityChange(item, 'increment')}
        >
          <Text className="text-lg font-bold">+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 p-4 bg-white">
      <Text className="text-2xl font-bold mb-4">Order for {table.tablename}</Text>
      <FlatList
        data={products.filter((product) => product.productsub === selectedSubCategory)}
        renderItem={renderProductItem}
        keyExtractor={(item) => item._id}
      />
      <View className="flex-row justify-around mt-4">
        {['softdrink', 'beer'].map((subCategory) => (
          <TouchableOpacity
            key={subCategory}
            className="px-6 py-2 bg-blue-200 rounded-lg"
            onPress={() => handleSubCategoryPress(subCategory)}
          >
            <Text className="text-lg font-bold">{subCategory}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}