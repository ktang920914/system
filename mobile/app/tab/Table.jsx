import { View, Text } from 'react-native'
import React, { useEffect, useState } from 'react'

export default function Table() {

  const [tables, setTables] = useState([])

  useEffect(() => {
    fetchTables()
  },[])

  const fetchTables = async () => {
    try {
      const res = await fetch('http://192.168.212.66:3000/api/table/get-tables')
      const data = await res.json()
      if(res.ok){
        setTables(data)
      }else{
        console.log(data.message)
      }
    } catch (error) {
      console.log(error.message)
    }
  }

  return (
    <View>
      <Text>Table</Text>
    </View>
  )
}