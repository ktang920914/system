import { Text, View } from "react-native";
import '../app/global.css'
import Main from '../components/Main.jsx'
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import {store, persistor} from '../redux/store'

export default function Index() {
  return (
    <PersistGate persistor={persistor}>
    <Provider store={store}>
      <View className="flex-1 items-center justify-center">
        <Main/>
      </View>
      </Provider>
      </PersistGate>

    
  );
}
