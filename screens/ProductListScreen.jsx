import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import categories from "../constants/categories";

export default function ProductListScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "products"), where("approved", "==", true)),
      (snapshot) => {
        const loaded = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(loaded);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "reviews"), (snapshot) => {
      const all = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        const pid = data.productId;
        if (!all[pid]) all[pid] = [];
        all[pid].push(data);
      });
      setReviews(all);
    });
    return () => unsubscribe();
  }, []);

  const filtered = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const categorized = categories.reduce((acc, cat) => {
    acc[cat] = filtered.filter((p) => p.category === cat);
    return acc;
  }, {});

  const renderProduct = (item) => {
    const productReviews = reviews[item.id] || [];
    const avgRating = productReviews.length
      ? (
          productReviews.reduce((sum, r) => sum + r.rating, 0) /
          productReviews.length
        ).toFixed(1)
      : null;
    const displayImage = item.images?.[0] || item.image;
    const seasonal = item.seasonal && item.season;

    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("ProductDetail", { productId: item.id })
        }
        style={styles.card}
      >
        <View style={styles.imageWrapper}>
          <Image source={{ uri: displayImage }} style={styles.image} />
          {seasonal && (() => {
            const seasonStyles = {
              Winter: { emoji: "❄️", backgroundColor: "#dbeafe", textColor: "#1e3a8a" },
              Spring: { emoji: "🌱", backgroundColor: "#d1fae5", textColor: "#065f46" },
              Summer: { emoji: "☀️", backgroundColor: "#fffdd0", textColor: "#92400e" },
              Fall:   { emoji: "🍂", backgroundColor: "#ffaa33", textColor: "#78350f" },
            };
            const style = seasonStyles[item.season] || {};
            return (
              <Text
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: "bold",
                  backgroundColor: style.backgroundColor || "#fef08a",
                  color: style.textColor || "#92400e",
                  zIndex: 10,
                }}
              >
                {style.emoji || "🌟"} {item.season}
              </Text>
            );
          })()}
        </View>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.rating}>
          {avgRating ? `⭐ ${avgRating}` : "Not yet rated"}
        </Text>
        <Text numberOfLines={2} style={styles.description}>
          {item.description}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <View style={styles.hero}>
          <Image
            source={require("../assets/groceries.jpg")}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>Explore Trader Joe's Reviews</Text>
            <Text style={styles.heroText}>
              Find top-rated items and share your favorites.
            </Text>

            {user ? (
              <TouchableOpacity style={styles.heroButton}>
                <Text style={styles.heroButtonText}>Browse Products</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.heroButton}
                onPress={() => navigation.navigate("Auth")}
              >
                <Text style={styles.heroButtonText}>Log In</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TextInput
          placeholder="Search for a product..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.search}
        />

        {categories.map((cat) => {
          const list = categorized[cat];
          if (!list || list.length === 0) return null;

          return (
            <View key={cat} style={styles.category}>
              <Text style={styles.categoryTitle}>{cat}</Text>
              <FlatList
                data={list}
                renderItem={({ item }) => renderProduct(item)}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
              />
            </View>
          );
        })}
      </ScrollView>

      {/* FAB always visible — routes based on user */}
      <TouchableOpacity
        onPress={() => navigation.navigate(user ? "AddItem" : "Auth")}
        style={styles.fabRow}
      >
        <View style={styles.fabLabelBox}>
          <Text style={styles.fabLabelText}>Add Item</Text>
        </View>
        <View style={styles.fab}>
          <Text style={styles.fabText}>＋</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: "#fff",
  },
  search: {
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  category: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#fef3c7",
    padding: 10,
    marginRight: 12,
    borderRadius: 10,
    width: 180,
  },
  imageWrapper: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    marginBottom: 6,
  },
  name: {
    fontWeight: "700",
    fontSize: 16,
  },
  rating: {
    color: "#f59e0b",
    fontSize: 14,
  },
  description: {
    color: "#374151",
    fontSize: 13,
  },
  hero: {
    position: "relative",
    height: 220,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  heroText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
  },
  heroButton: {
    backgroundColor: "#b91c1c",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  heroButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  fabRow: {
    position: "absolute",
    right: 20,
    bottom: 30,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 999,
  },
  fabLabelBox: {
    backgroundColor: "#22c55e",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 30,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    marginRight: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  fabLabelText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  fab: {
    backgroundColor: "#22c55e",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
});
