import React from 'react';
import {NavigationContainer, DefaultTheme, DarkTheme} from '@react-navigation/native';
import {useColorScheme} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {BottomTabs} from './src/navigation/BottomTabs';
import {GuestProvider} from './src/context/GuestProvider';

const App = () => {
  const scheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <GuestProvider>
        <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
          <BottomTabs />
        </NavigationContainer>
      </GuestProvider>
    </GestureHandlerRootView>
  );
};

export default App;
