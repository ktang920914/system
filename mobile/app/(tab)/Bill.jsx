import { View, Text, ScrollView, StyleSheet } from 'react-native';
import React, { useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';

export default function Bill() {
  const params = useLocalSearchParams();
  const { tableName, orderDetails } = params || {};
  
  const parsedOrderDetails = orderDetails ? JSON.parse(orderDetails) : null;

  useEffect(() => {
    console.log('Order details:', parsedOrderDetails);
  }, [parsedOrderDetails]);

  if (!parsedOrderDetails) {
    return (
      <View style={styles.container}>
        <Text>No order details available</Text>
      </View>
    );
  }

  const calculateSubtotal = () => {
    let subtotal = 0;
    
    parsedOrderDetails.items.forEach(item => {
      subtotal += item.orderproductprice * item.orderproductquantity;
    });
    
    parsedOrderDetails.comboItems.forEach(combo => {
      subtotal += combo.comboproductprice * combo.comboproductquantity;
    });
    
    return subtotal;
  };

  const subtotal = calculateSubtotal();
  const taxRate = parsedOrderDetails.taxRate / 100 || 0.08;
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Order Bill</Text>
        <Text style={styles.tableText}>Table: {tableName}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order #{parsedOrderDetails.ordernumber}</Text>
        <Text style={styles.dateText}>
          {new Date(parsedOrderDetails.createdAt).toLocaleString()}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items:</Text>
        
        {parsedOrderDetails.items.map((item, index) => (
          <View key={`item-${index}`} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.orderproductname}</Text>
            <View style={styles.itemDetails}>
              <Text style={styles.itemQuantity}>x{item.orderproductquantity}</Text>
              <Text style={styles.itemPrice}>
                RM {(item.orderproductprice * item.orderproductquantity).toFixed(2)}
              </Text>
            </View>
          </View>
        ))}

        {parsedOrderDetails.comboItems.map((combo, index) => (
          <View key={`combo-${index}`}>
            <View style={styles.itemRow}>
              <Text style={styles.itemName}>{combo.comboproductitem} (Combo)</Text>
              <View style={styles.itemDetails}>
                <Text style={styles.itemQuantity}>x{combo.comboproductquantity}</Text>
                <Text style={styles.itemPrice}>
                  RM {(combo.comboproductprice * combo.comboproductquantity).toFixed(2)}
                </Text>
              </View>
            </View>
            
            {combo.combochooseitems.map((item, itemIndex) => (
              <View key={`combo-item-${index}-${itemIndex}`} style={styles.comboItem}>
                <Text style={styles.comboItemText}>• {item.combochooseitemname} (x{item.combochooseitemquantity})</Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal:</Text>
          <Text style={styles.totalValue}>RM {subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tax ({parsedOrderDetails.taxRate || 8}%):</Text>
          <Text style={styles.totalValue}>RM {taxAmount.toFixed(2)}</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={styles.grandTotalLabel}>Total:</Text>
          <Text style={styles.grandTotalValue}>RM {totalAmount.toFixed(2)}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 10,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 5,
    color: '#555',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  dateText: {
    color: '#666',
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemName: {
    fontSize: 16,
    flex: 2,
  },
  itemDetails: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemQuantity: {
    fontSize: 16,
    color: '#555',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  comboItem: {
    paddingLeft: 20,
    marginBottom: 4,
  },
  comboItemText: {
    fontSize: 14,
    color: '#666',
  },
  totalsSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  grandTotal: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#006b7e',
  },
});