import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  RecipeList: undefined;
  RecipeDetail: { id: number };
  RecipeForm: { id?: number };
  Filters: undefined;
  CookingMethods: undefined;
  Settings: undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
