import { View, Text, FlatList, TouchableOpacity } from 'react-native';
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
      const res = await fetch('http://192.168.212.66:3000/api/table/get-tables');
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
      const res = await fetch('http://192.168.212.66:3000/api/area/get-areas');
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

  // Memoized table item renderer
  const renderTableItem = useCallback(({ item }) => {
    let backgroundColor = 'bg-green-200';
    let statusText = 'Available';
    let isClickable = false;

    if (item.reserve?.status) {
      backgroundColor = 'bg-red-200';
      statusText = 'Booked';
    } else if (item.open?.status) {
      backgroundColor = 'bg-yellow-200';
      statusText = 'Opened';
      isClickable = true;
    }

    return (
      <TouchableOpacity
        disabled={!isClickable}
        onPress={() => navigation.navigate('Order', { table: item })}
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
    setRefreshKey(prev => prev + 1); // Force re-render
  };

  // Handler for area changes
  const handleAreaChange = (itemValue) => {
    console.log('AREA CHANGED:', itemValue);
    setSelectedArea(itemValue);
    setRefreshKey(prev => prev + 1); // Force re-render
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

  // Main render
  return (
    <View className="flex-1 p-4 bg-white" key={refreshKey}>
      {/* Filter controls */}
      <View className="flex-row justify-between mb-4">
        <Picker
          style={{ height: 50, width: 150 }}
          selectedValue={selectedArea}
          onValueChange={handleAreaChange}
        >
          <Picker.Item label="All Areas" value={null} />
          {areas.map((area) => (
            <Picker.Item key={area._id} label={area.areaname} value={area._id} />
          ))}
        </Picker>
        
        <Picker
          style={{ height: 50, width: 200 }}
          selectedValue={selectedStatus}
          onValueChange={handleStatusChange}
        >
          <Picker.Item label="All Status" value={null} />
          <Picker.Item label="Reservation" value="reservation" />
          <Picker.Item label="Open" value="open" />
        </Picker>
      </View>

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
          extraData={refreshKey} // Force updates
        />
      )}
    </View>
  );
}