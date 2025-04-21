import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import categoryAssets from "./CategoryAssets.jsx";

export default function CategoryScreen() {
  const { params } = useRoute();
  const navigation = useNavigation();
  const category = params?.category || "";
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const assets = categoryAssets[category] || {};

  useEffect(() => {
    const fetchProducts = async () => {
      const q = query(
        collection(db, "products"),
        where("category", "==", category)
      );
      const snapshot = await getDocs(q);
      const productList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productList);
    };

    fetchProducts();
  }, [category]);

  const filteredProducts = products.filter((p) =>
    (p.name + p.description).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate("ProductDetail", { productId: item.id })
      }
    >
      <Image
        source={{ uri: item.image }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.cardDescription} numberOfLines={2}>
        {item.description}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {assets.headerImage && (
        <Image source={assets.headerImage} style={styles.bannerImage} />
      )}

      <Text style={styles.header}>{category}</Text>

      <TextInput
        placeholder="Search in this category..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchInput}
      />

      <FlatList
        data={filteredProducts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.grid}
        numColumns={2}
      />

      {assets.footerImage && (
        <Image source={assets.footerImage} style={styles.footerImage} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  bannerImage: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    marginBottom: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  grid: {
    paddingBottom: 20,
  },
  card: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 8,
    margin: 6,
  },
  cardImage: {
    width: "100%",
    height: 120,
    borderRadius: 6,
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: "bold",
    fontSize: 16,
  },
  cardDescription: {
    fontSize: 12,
    color: "#6b7280",
  },
  footerImage: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    marginTop: 20,
  },
});