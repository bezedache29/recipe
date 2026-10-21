import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { colors, fonts, fontSize } from '../theme';
import CookingMethodsScreen from '../screens/CookingMethodsScreen';
import FiltersScreen from '../screens/FiltersScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import RecipeFormScreen from '../screens/RecipeFormScreen';
import RecipeListScreen from '../screens/RecipeListScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        headerTitleStyle: { fontFamily: fonts.heading, fontSize: fontSize.xl },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="RecipeList"
        component={RecipeListScreen}
        options={{ title: 'Mes recettes' }}
      />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
      <Stack.Screen name="RecipeForm" component={RecipeFormScreen} />
      <Stack.Screen
        name="Filters"
        component={FiltersScreen}
        options={{ title: 'Filtres', presentation: 'modal' }}
      />
      <Stack.Screen
        name="CookingMethods"
        component={CookingMethodsScreen}
        options={{ title: 'Cuissons' }}
      />
    </Stack.Navigator>
  );
}
