import { View, Text, FlatList, TouchableOpacity, Image, ScrollView, StyleSheet } from 'react-native';
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
          
          // Extract unique subcategories
          const uniqueSubs = {};
          data.forEach(product => {
            if (product.productsub && product.productsub._id) {
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

  // Filter products by selected subcategory
  const filteredProducts = selectedSubCategory 
    ? products.filter(product => product.productsub?._id === selectedSubCategory._id)
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
    <View style={styles.productItem}>
      <Image 
        source={{ uri: item.productimage || 'https://via.placeholder.com/100' }} 
        style={styles.productImage} 
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.productname}</Text>
        <Text style={styles.productPrice}>RM {item.productprice.toFixed(2)}</Text>
        
        <View style={styles.quantityControls}>
          <TouchableOpacity 
            style={[styles.quantityButton, styles.quantityButtonLeft]}
            onPress={() => handleQuantityChange(item._id, -1)}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{orderItems[item._id] || 0}</Text>
          <TouchableOpacity 
            style={[styles.quantityButton, styles.quantityButtonRight]}
            onPress={() => handleQuantityChange(item._id, 1)}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Subcategories List (Left Side) */}
      <ScrollView style={styles.subCategoriesContainer}>
        {subCategories.map(sub => (
          <TouchableOpacity
            key={sub._id}
            style={[
              styles.subCategoryItem,
              selectedSubCategory?._id === sub._id && styles.selectedSubCategory
            ]}
            onPress={() => setSelectedSubCategory(sub)}
          >
            <Text style={styles.subCategoryText}>{sub.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products List (Right Side) */}
      <View style={styles.productsContainer}>
        {selectedSubCategory ? (
          <FlatList
            data={filteredProducts}
            renderItem={renderProductItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.productsList}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text>Select a category to view products</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
  },
  subCategoriesContainer: {
    width: '30%',
    backgroundColor: '#f5f5f5',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  subCategoryItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  selectedSubCategory: {
    backgroundColor: '#e3f2fd',
  },
  subCategoryText: {
    fontSize: 16,
  },
  productsContainer: {
    width: '70%',
  },
  productsList: {
    padding: 10,
  },
  productItem: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 5,
    marginRight: 15,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#006b7e',
    padding: 8,
    borderRadius: 4,
    minWidth: 30,
    alignItems: 'center',
  },
  quantityButtonLeft: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  quantityButtonRight: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  quantityButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quantityText: {
    fontSize: 16,
    width: 30,
    textAlign: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});