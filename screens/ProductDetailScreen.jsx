import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  Button,
  Alert,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Modal
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import EditProductForm from "../screens/EditProductForm";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ProductDetailScreen() {
  const { params } = useRoute();
  const navigation = useNavigation();
  const { productId } = params;

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [includeName, setIncludeName] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProductAndReviews = async () => {
      try {
        const productDoc = await getDoc(doc(db, "products", productId));
        if (productDoc.exists()) {
          setProduct({ id: productDoc.id, ...productDoc.data() });
        }

        const q = query(
          collection(db, "reviews"),
          where("productId", "==", productId)
        );
        const snapshot = await getDocs(q);

        const allReviews = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const review = docSnap.data();
            const reviewId = docSnap.id;

            const imagesSnap = await getDocs(
              query(
                collection(db, `reviews/${reviewId}/images`),
                where("approved", "==", true)
              )
            );

            const images = imagesSnap.docs.map((imgDoc) => ({
              id: imgDoc.id,
              ...imgDoc.data(),
            }));
            return { ...review, id: reviewId, images };
          })
        );

        setReviews(allReviews);
      } catch (err) {
        console.error("Error loading product:", err);
        Alert.alert("Error", "Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndReviews();
  }, [productId]);

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission required", "Camera roll access is needed.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      if (!asset.uri) {
        Alert.alert("Error", "Could not get image URI.");
        return;
      }
      setSelectedImage(asset);
    }
  };

  const handleReviewSubmit = async () => {
    if (!reviewText || reviewRating === 0) {
      Alert.alert("Missing info", "Please provide text and rating.");
      return;
    }

    try {
      let nickname = null;
      if (includeName) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          nickname = userDoc.data().nickname || "Anonymous";
        } else {
          nickname = "Anonymous";
        }
      }

      const reviewRef = await addDoc(collection(db, "reviews"), {
        productId,
        text: reviewText,
        rating: parseFloat(reviewRating),
        createdAt: serverTimestamp(),
        userEmail: user.email,
        nickname: includeName ? nickname : null,
      });

      if (selectedImage) {
        let blob;
        try {
          const res = await fetch(selectedImage.uri);
          blob = await res.blob();
          if (!blob || blob.size === 0) {
            Alert.alert("Image Error", "Selected image could not be read.");
            return;
          }
        } catch (err) {
          Alert.alert("Image Error", "Could not upload image.");
          return;
        }

        const ext = selectedImage.uri.split(".").pop().split("?")[0] || "jpg";
        const filename = `review-images/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${ext}`;

        const imageRef = ref(storage, filename);
        await uploadBytes(imageRef, blob);
        const url = await getDownloadURL(imageRef);

        await addDoc(collection(db, `reviews/${reviewRef.id}/images`), {
          url: url,
          approved: false,
          uploadedAt: serverTimestamp(),
        });
      }

      setReviewText("");
      setReviewRating(0);
      setSelectedImage(null);
      setIncludeName(true);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setShowReviewForm(false);
      Alert.alert("Review posted!");
    } catch (err) {
      Alert.alert("Error", "Failed to submit review");
    }
  };

  if (loading || !product) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const averageRating = reviews.length
    ? (
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      ).toFixed(1)
    : null;

  const seasonStyles = {
    Winter: { emoji: "❄️", color: "#3b82f6" },
    Spring: { emoji: "🌱", color: "#10b981" },
    Summer: { emoji: "☀️", color: "#f59e0b" },
    Fall: { emoji: "🍂", color: "#ea580c" },
  };
  const season = product.seasonal && product.season;
  const seasonStyle = seasonStyles[season] || {};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={{ uri: product.images?.[0] || product.image }}
        style={styles.image}
      />
      {season && (
        <Text style={[styles.seasonal, { color: seasonStyle.color }]}>
          {seasonStyle.emoji} Limited Time: {season}
        </Text>
      )}

      <Text style={styles.name}>{product.name}</Text>

      <Text style={styles.description}>{product.description}</Text>

      <Text style={styles.rating}>
        {averageRating
          ? `⭐ ${averageRating} (${reviews.length})`
          : "Not yet rated"}
      </Text>

      {/* Review Form Toggle Button */}
      <TouchableOpacity
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          if (!user) return navigation.navigate("Auth");
          setShowReviewForm(!showReviewForm);
        }}
        style={styles.toggleButton}
      >
        <Text style={styles.toggleButtonText}>
          {showReviewForm ? "Hide Review Form" : user ? "Add Your Review" : "Log in to leave a review"}
        </Text>
      </TouchableOpacity>

      {/* Review Form */}
      {/* Add Review Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showReviewForm}
        onRequestClose={() => setShowReviewForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => setShowReviewForm(false)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>✖ Close</Text>
            </TouchableOpacity>

            {user ? (
              <>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setReviewRating(star)}
                      activeOpacity={0.7}
                    >
                      <Text style={reviewRating >= star ? styles.filledStar : styles.emptyStar}>
                        {reviewRating >= star ? '★' : '☆'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  placeholder="Write your review..."
                  multiline
                  value={reviewText}
                  onChangeText={setReviewText}
                  style={[styles.input, { height: 80 }]}
                />
                <View style={styles.checkboxRow}>
                  <TouchableOpacity
                    onPress={() => setIncludeName(!includeName)}
                    style={styles.checkbox}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        backgroundColor: includeName ? "#4f46e5" : "#fff",
                        borderColor: "#ccc",
                        borderWidth: 1,
                        borderRadius: 4,
                        marginRight: 8,
                      }}
                    />
                    <Text style={{ fontSize: 14 }}>Include my nickname</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={handlePickImage} style={styles.imageButton}>
                  <Text style={styles.imageButtonText}>📸 Add a Photo</Text>
                </TouchableOpacity>
                {selectedImage && (
                  <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
                )}
                <Button title="Submit Review" onPress={handleReviewSubmit} />
              </>
            ) : (
              <Text style={{ fontSize: 16, textAlign: "center" }}>
                Please log in to leave a review.
              </Text>
            )}
          </View>
        </View>
      </Modal>

      {/* Edit Product Toggle Button */}
      <TouchableOpacity
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          if (!user) return navigation.navigate("Auth");
          setEditing(true);
        }}
        style={styles.toggleButton}
      >
        <Text style={styles.toggleButtonText}>
          {user ? "✏️ Edit Product" : "Log in to edit product"}
        </Text>
      </TouchableOpacity>

      {/* Edit Product Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editing}
        onRequestClose={() => setEditing(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => setEditing(false)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>✖ Close</Text>
            </TouchableOpacity>

            <EditProductForm
              product={product}
              onCancel={() => setEditing(false)}
              onSave={() => {
                setEditing(false);
                Alert.alert("✅ Edit submitted for admin review.");
              }}
            />
          </View>
        </View>
      </Modal>

      <Text style={styles.section}>Reviews</Text>
      {reviews.map((r, idx) => (
        <View key={idx} style={styles.review}>
          <Text style={styles.reviewRating}>⭐ {r.rating}</Text>
          <Text>{r.text}</Text>

          {r.images && r.images.length > 0 && (
            <ScrollView horizontal style={{ marginTop: 8 }}>
              {r.images.map((img, i) =>
                img.url ? (
                  <Image
                    key={i}
                    source={{ uri: img.url }}
                    style={styles.reviewImage}
                    resizeMode="cover"
                    onError={() => console.warn("❌ Failed to load image:", img.url)}
                  />
                ) : null
              )}
            </ScrollView>
          )}

          <Text style={{ fontStyle: "italic", fontSize: 12, color: "#6b7280", marginTop: 4 }}>
            by {r.nickname || "Anonymous"}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  seasonal: {
    fontWeight: "600",
    marginBottom: 8,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  description: {
    color: "#4b5563",
    marginBottom: 8,
  },
  rating: {
    fontSize: 16,
    color: "#f59e0b",
    marginBottom: 12,
  },
  section: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 8,
  },
  review: {
    backgroundColor: "#f3f4f6",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  reviewRating: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  imageButton: {
    backgroundColor: "#4f46e5",
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  imageButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  reviewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: "#f3f4f6",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checkbox: {
    flexDirection: "row",
    alignItems: "center",
  },
  toggleButton: {
    backgroundColor: "#10b981",
    padding: 10,
    borderRadius: 6,
    marginBottom: 16,
  },
  toggleButtonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "100%",
    maxHeight: "90%",
  },
  modalCloseButton: {
    alignSelf: "flex-end",
    marginBottom: 10,
  },
  modalCloseText: {
    color: "#ef4444",
    fontWeight: "bold",
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    marginBottom: 12,
    backgroundColor: "#fff", // help ensure visibility
  },
  picker: {
    height: 50,
    width: "100%",
    color: "#000", // make sure text isn't invisible
    backgroundColor: "#fff", // important for Android in Modal
  },  
  pickerWrapper: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
    color: "#374151",
  },
  ratingWrapper: {
    marginBottom: 12,
  },
  starRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  filledStar: {
    fontSize: 32,
    marginHorizontal: 4,
    color: "#f59e0b", // amber
  },
  emptyStar: {
    fontSize: 32,
    marginHorizontal: 4,
    color: "#d1d5db", // light gray
  },  
});
