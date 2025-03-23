import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const Safescreen = ({children}) => {
    const insets = useSafeAreaInsets()
  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      {children}
    </View>
  )
}

export default Safescreen

const styles = StyleSheet.create({
    container:{
        flex:1
    }
})