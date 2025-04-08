import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigation } from "@react-navigation/native";
import Animated from "react-native-reanimated";

// 🖼️ Images
import winterImg from "../assets/winter.jpg";
import springImg from "../assets/spring2.jpg";
import summerImg from "../assets/summer.jpg";
import fallImg from "../assets/fall.jpg";
import otherSeasonsImg from "../assets/otherseasons2.jpg";
import { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { Dimensions } from "react-native";
import petalImg from "../assets/petal.png";

const seasonImages = {
  Winter: winterImg,
  Spring: springImg,
  Summer: summerImg,
  Fall: fallImg,
};

const seasonOrder = ["Winter", "Spring", "Summer", "Fall"];

function getCurrentSeason() {
  const month = new Date().getMonth();
  if (month <= 1 || month === 11) return "Winter";
  if (month >= 2 && month <= 4) return "Spring";
  if (month >= 5 && month <= 7) return "Summer";
  return "Fall";
}

function FallingPetal({ screenHeight, screenWidth }) {
    const x = Math.random() * screenWidth * 0.9;
    const delay = Math.random() * 1000;
    const drop = useSharedValue(-50);
  
    useEffect(() => {
      const timeout = setTimeout(() => {
        drop.value = withTiming(screenHeight + 50, { duration: 4000 });
      }, delay);
      return () => clearTimeout(timeout);
    }, []);
  
    const style = useAnimatedStyle(() => ({
      position: "absolute",
      top: drop.value,
      left: x,
      width: 24,
      height: 24,
      opacity: 0.8,
    }));
  
    return <Animated.Image source={petalImg} style={style} />;
  }
  
export default function SeasonalScreen() {
  const [seasonalProducts, setSeasonalProducts] = useState({
    Winter: [],
    Spring: [],
    Summer: [],
    Fall: [],
  });

  const currentSeason = getCurrentSeason();
  const navigation = useNavigation();
  const [showPetals, setShowPetals] = useState(false);
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;

  useEffect(() => {
    if (currentSeason === "Spring") {
      setShowPetals(true);
      setTimeout(() => setShowPetals(false), 5000); // show petals for 5 sec
    }
  }, [currentSeason]);

  useEffect(() => {
    const q = query(collection(db, "products"), where("seasonal", "==", true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsBySeason = { Winter: [], Spring: [], Summer: [], Fall: [] };
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.season && productsBySeason[data.season]) {
          productsBySeason[data.season].push({ id: doc.id, ...data });
        }
      });
      setSeasonalProducts(productsBySeason);
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={{ flex: 1 }}>
    {/* Petal layer - on top */}
    {showPetals && (
      <View style={styles.petalOverlay} pointerEvents="none">
        {[...Array(20)].map((_, i) => (
          <FallingPetal
            key={i}
            screenWidth={screenWidth}
            screenHeight={screenHeight}
          />
        ))}
      </View>
    )}
 
    <ScrollView contentContainerStyle={styles.container}>

      {/* Banner for Current Season */}
      <Image
        source={seasonImages[currentSeason]}
        style={styles.bannerImage}
        resizeMode="cover"
      />
      <Text style={styles.sectionTitle}>{currentSeason}</Text>
      <ProductGrid
        products={seasonalProducts[currentSeason] || []}
        navigation={navigation}
      />

      <Text style={styles.sectionTitle}>Other Seasons</Text>
      <Image
        source={otherSeasonsImg}
        style={styles.bannerImage}
        resizeMode="cover"
      />

      {seasonOrder
        .filter((s) => s !== currentSeason)
        .map((season) => (
          <View key={season} style={{ marginBottom: 24 }}>
            <Text style={styles.subheading}>{season}</Text>
            <ProductGrid
              products={seasonalProducts[season] || []}
              navigation={navigation}
            />
          </View>
        ))}
    </ScrollView>
    </View>
  );
}

function ProductGrid({ products, navigation }) {
  if (!products || products.length === 0) {
    return (
      <Text style={styles.noProducts}>No seasonal products yet.</Text>
    );
  }

  return (
    <View style={styles.grid}>
      {products.map((product) => (
        <TouchableOpacity
          key={product.id}
          style={styles.card}
          onPress={() => navigation.navigate("ProductDetail", { productId: product.id })}
        >
          <Image source={{ uri: product.image }} style={styles.cardImage} />
          <Text style={styles.cardTitle}>{product.name}</Text>
          <Text style={styles.cardDescription} numberOfLines={2}>
            {product.description}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
  bannerImage: {
    width: "100%",
    height: 125,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  subheading: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 16,
  },
  noProducts: {
    fontStyle: "italic",
    color: "#9ca3af",
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  card: {
    width: "48%",
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
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
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: "#6b7280",
  },
  petalOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999, // floats on top
  },
});