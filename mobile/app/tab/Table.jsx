import { View, Text, FlatList } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Picker } from '@react-native-picker/picker';

export default function Table() {
  const [tables, setTables] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    fetchTables();
    fetchAreas();
  }, []);

  const fetchTables = async () => {
    try {
      const res = await fetch('http://192.168.212.66:3000/api/table/get-tables');
      const data = await res.json();
      if (res.ok) {
        setTables(data);
      } else {
        console.log(data.message);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const fetchAreas = async () => {
    try {
      const res = await fetch('http://192.168.212.66:3000/api/area/get-areas');
      const data = await res.json();
      if (res.ok) {
        setAreas(data);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const filteredTables = tables.filter((table) => {
    const areaMatch = selectedArea ? table.area === selectedArea : true;
    const statusMatch = selectedStatus
      ? selectedStatus === 'reservation'
        ? table.reserve.status
        : selectedStatus === 'open'
        ? table.open.status
        : true
      : true;
    return areaMatch && statusMatch;
  });

  // 将 area _id 转换为 areaname
  const getAreaNameById = (areaId) => {
    const area = areas.find((area) => area._id === areaId);
    return area ? area.areaname : 'Unknown Area';
  };

  const renderTableItem = ({ item }) => {
    // 动态设置背景颜色
    let backgroundColor = 'bg-green-200'; // 默认背景颜色
    if (item.open.status) {
      backgroundColor = 'bg-yellow-200'; // open status 为 true
    } else if (item.reserve.status) {
      backgroundColor = 'bg-red-200'; // reserve status 为 true
    }

    return (
      <View className={`flex-1 m-2 p-5 rounded-lg ${backgroundColor}`}>
        <Text className="text-lg font-bold">{item.tablename}</Text>
        <Text className="text-gray-700">Area: {getAreaNameById(item.area)}</Text>
        <Text className="text-gray-700">
          Status: {item.reserve.status ? 'Reserved' : 'Open'}
        </Text>
      </View>
    );
  };

  return (
    <View className="flex-1 p-4 bg-white">
      <View className="flex-row justify-between mb-4">
        <Picker
          selectedValue={selectedArea}
          className="h-12 w-40"
          onValueChange={(itemValue) => setSelectedArea(itemValue)}
        >
          <Picker.Item label="All Areas" value="" />
          {areas.map((area) => (
            <Picker.Item key={area._id} label={area.areaname} value={area._id} />
          ))}
        </Picker>
        <Picker
          selectedValue={selectedStatus}
          className="h-12 w-40"
          onValueChange={(itemValue) => setSelectedStatus(itemValue)}
        >
          <Picker.Item label="All Status" value="" />
          <Picker.Item label="Reservation" value="reservation" />
          <Picker.Item label="Open" value="open" />
        </Picker>
      </View>

      <FlatList
        data={filteredTables}
        renderItem={renderTableItem}
        keyExtractor={(item) => item._id}
        numColumns={2}
      />
    </View>
  );
}