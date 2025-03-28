import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';

export default function Table() {
  const navigation = useNavigation();
  const [tables, setTables] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchTables(), fetchAreas()]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchTables = async () => {
    try {
      const res = await fetch('http://192.168.208.66:3000/api/table/get-tables');
      const data = await res.json();
      if (res.ok) {
        setTables(data);
      } else {
        throw new Error(data.message || 'Failed to fetch tables');
      }
    } catch (error) {
      console.error('Table fetch error:', error);
      setError(error.message);
    }
  };

  const fetchAreas = async () => {
    try {
      const res = await fetch('http://192.168.208.66:3000/api/area/get-areas');
      const data = await res.json();
      if (res.ok) {
        setAreas(data);
      } else {
        throw new Error(data.message || 'Failed to fetch areas');
      }
    } catch (error) {
      console.error('Area fetch error:', error);
      setError(error.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchTables(), fetchAreas()]);
    } catch (error) {
      setError(error.message);
    } finally {
      setRefreshing(false);
    }
  };

  // Filter tables based on selections
  const filteredTables = useMemo(() => {
    console.log('FILTERING - Status:', selectedStatus, 'Area:', selectedArea);
    return tables.filter((table) => {
      const areaMatch = selectedArea ? table.area === selectedArea : true;
      
      if (selectedStatus === 'reservation') {
        return areaMatch && table.reserve?.status === true;
      } else if (selectedStatus === 'open') {
        return areaMatch && table.open?.status === true;
      }
      return areaMatch; // All Status
    });
  }, [tables, selectedArea, selectedStatus, refreshKey]);

  // Memoized helper function
  const getAreaNameById = useCallback((areaId) => {
    const area = areas.find((area) => area._id === areaId);
    return area ? area.areaname : 'Unknown Area';
  }, [areas]);

  // 修改 Table.js 中的 renderTableItem 函数
const renderTableItem = useCallback(({ item }) => {
  let backgroundColor = 'bg-green-200';
  let statusText = 'Available ';
  let isClickable = false;

  if (item.reserve?.status) {
      backgroundColor = 'bg-red-200';
      statusText = 'Reserved';
  } else if (item.open?.status) {
      backgroundColor = 'bg-yellow-200';
      statusText = 'Opened   ';
      isClickable = true;
  }

  const handleTablePress = async () => {
      try {
          // 检查该桌子是否有未完成的订单
          const response = await fetch(
              `http://192.168.208.66:3000/api/order/get-order-by-table/${item._id}`
          );
          const result = await response.json();

          if (response.ok && result.success) {
              // 如果有订单，导航到订单页面并传递现有订单数据
              navigation.navigate('add-order/Order', {
                  tableId: item._id,
                  tableName: item.tablename,
                  existingOrder: JSON.stringify({
                      ordernumber: result.order.ordernumber,
                      items: result.order.orderitems,
                      comboItems: result.order.ordercomboitem
                  })
              });
          } else {
              // 如果没有订单，创建新订单
              navigation.navigate('add-order/Order', {
                  tableId: item._id,
                  tableName: item.tablename
              });
          }
      } catch (error) {
          console.error('Error checking order:', error);
          // 出错时仍然允许创建新订单
          navigation.navigate('add-order/Order', {
              tableId: item._id,
              tableName: item.tablename
          });
      }
  };

  return (
      <TouchableOpacity
          disabled={!isClickable}
          onPress={handleTablePress}
      >
          <View className={`flex-1 m-2 p-5 rounded-lg ${backgroundColor}`}>
              <Text className="text-lg font-bold">{item.tablename}</Text>
              <Text className="text-gray-700">Area: {getAreaNameById(item.area)}</Text>
              <Text className="text-gray-700">Status: {statusText}</Text>
          </View>
      </TouchableOpacity>
  );
}, [getAreaNameById, navigation]);

  // Handler for status changes
  const handleStatusChange = (itemValue) => {
    console.log('STATUS CHANGED:', itemValue);
    setSelectedStatus(itemValue);
    setRefreshKey(prev => prev + 1);
  };

  // Handler for area changes
  const handleAreaChange = (itemValue) => {
    console.log('AREA CHANGED:', itemValue);
    setSelectedArea(itemValue);
    setRefreshKey(prev => prev + 1);
  };

  // Reset all filters
  const resetAllFilters = () => {
    setSelectedArea(null);
    setSelectedStatus(null);
    setRefreshKey(prev => prev + 1);
  };

  // Loading state
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading tables...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-red-500">Error: {error}</Text>
        <TouchableOpacity 
          className="mt-4 p-3 bg-blue-500 rounded"
          onPress={() => {
            setError(null);
            setLoading(true);
            Promise.all([fetchTables(), fetchAreas()]).finally(() => setLoading(false));
          }}
        >
          <Text className="text-white">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 p-4 bg-white" key={refreshKey}>
      {/* Filter controls */}
      <View className="flex-row justify-between mb-2">
        <View className="flex-row items-center">
          <Picker
            style={{height:50, width:150}}
            className="h-12 w-40"
            selectedValue={selectedArea}
            onValueChange={handleAreaChange}
          >
            <Picker.Item label="Areas" value={null} />
            {areas.map((area) => (
              <Picker.Item key={area._id} label={area.areaname} value={area._id} />
            ))}
          </Picker>
        </View>
        
        <View className="flex-row items-center">
          <Picker
            style={{height:50, width:150}}
            className="h-12 w-40"
            selectedValue={selectedStatus}
            onValueChange={handleStatusChange}
          >
            <Picker.Item label="Status" value={null} />
            <Picker.Item label="Reservation" value="reservation" />
            <Picker.Item label="Open" value="open" />
          </Picker>
        </View>
      </View>

      {/* Reset all button */}
      <TouchableOpacity 
        className="mb-4 p-3 bg-[#006b7e] rounded items-center"
        onPress={resetAllFilters}
      >
        <Text className="text-white font-bold">Reset All Filters</Text>
      </TouchableOpacity>

      {/* Table list */}
      {filteredTables.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text>No tables found matching your criteria</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTables}
          renderItem={renderTableItem}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={{ paddingBottom: 20 }}
          extraData={refreshKey}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3498db']}
              tintColor="#3498db"
            />
          }
        />
      )}
    </View>
  );
}