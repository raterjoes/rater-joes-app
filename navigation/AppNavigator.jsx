import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

import ProductListScreen from "../screens/ProductListScreen";
import ProductDetailScreen from "../screens/ProductDetailScreen";
import AuthScreen from "../screens/AuthScreen";
import UserMenuScreen from "../screens/UserMenuScreen";
import AddItemScreen from "../screens/AddItemScreen";
import ContactScreen from "../screens/ContactScreen";
import ChatBoardScreen from "../screens/ChatBoardScreen";
import SeasonalScreen from "../screens/SeasonalScreen";

import { useAuth } from "../context/AuthContext";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

// 👤 Avatar button for header
function UserInitialIcon({ navigation }) {
  const { user } = useAuth();
  const [initial, setInitial] = useState(null);

  useEffect(() => {
    const fetchInitial = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const nickname = userDoc.exists() ? userDoc.data().nickname : null;
        const nameSource = nickname || user.email || "";
        setInitial(nameSource.charAt(0).toUpperCase());
      }
    };
    fetchInitial();
  }, [user]);

  if (!user || !initial) return null;

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate("UserMenu")}
      style={styles.avatar}
    >
      <Text style={styles.avatarText}>{initial}</Text>
    </TouchableOpacity>
  );
}

// 🧭 HomeScreen that always resets to ProductList when navigated to
function HomeScreen({ navigation }) {
  const Stack = createNativeStackNavigator();

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: "HomeStack" }],
      });
    }, 0);
    return () => clearTimeout(timeout);
  }, [navigation]);

  return <MainStack />;
}

// 📦 Main stack with product screens
function MainStack() {
  return (
    <Stack.Navigator initialRouteName="ProductList">
      <Stack.Screen
        name="ProductList"
        component={ProductListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Auth"
        component={AuthScreen}
        options={{
          headerShown: false, // hides the "HomeStack" banner at the top
        }}
      />
      <Stack.Screen
        name="UserMenu"
        component={UserMenuScreen}
        options={{ title: "Account", presentation: "modal" }}
      />
      <Stack.Screen
        name="AddItem"
        component={AddItemScreen}
        options={{ title: "Add New Product" }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      <Drawer.Navigator initialRouteName="Home">
        <Drawer.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: "Rater Joe's",
            drawerLabel: "Home",
          }}
        />
        <Drawer.Screen
          name="HomeStack"
          component={MainStack}
          options={{
            drawerItemStyle: { height: 0 }, // hides it from the drawer
            title: "Rater Joe's",           // sets the correct banner title
          }}
        />
        <Drawer.Screen name="Contact" component={ContactScreen} />
        <Drawer.Screen name="ChatBoard" component={ChatBoardScreen} />
        <Drawer.Screen name="Seasonal" component={SeasonalScreen} />
        {!user && (
          <Drawer.Screen
            name="Auth"
            component={AuthScreen}
            options={{
              title: "Log In",
              drawerLabel: "Log In",
            }}
          />
        )}
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: "#fbbf24",
    borderRadius: 100,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarText: {
    fontWeight: "bold",
    color: "#fff",
  },
});