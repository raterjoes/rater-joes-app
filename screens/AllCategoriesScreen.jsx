import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import categories from "../screens/categories.js";
import categoryAssets from "./CategoryAssets.jsx";
import { useNavigation } from "@react-navigation/native";

export default function AllCategoriesScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: "#fff7ed" }]}>
      <Text style={styles.header}>Browse All Categories</Text>
      <View style={styles.grid}>
        {categories.map((category) => {
          const image =
            categoryAssets[category]?.thumbnailImage || null;

          return (
            <TouchableOpacity
              key={category}
              style={styles.card}
              onPress={() =>
                navigation.navigate("HomeStack", {
                    screen: "Category",
                    params: { category },
                  })
              }
            >
              {image ? (
                <Image source={image} style={styles.image} />
              ) : (
                <View style={styles.fallbackImage}>
                  <Text style={styles.emoji}>🛒</Text>
                </View>
              )}
              <Text style={styles.title}>{category}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    marginBottom: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  fallbackImage: {
    width: "100%",
    height: 100,
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 32,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});