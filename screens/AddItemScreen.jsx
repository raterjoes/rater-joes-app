import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import categories from "../constants/categories";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";

export default function AddItemScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();

  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [description, setDescription] = useState("");
  const [seasonal, setSeasonal] = useState(false);
  const [season, setSeason] = useState("Winter");
  const [images, setImages] = useState([]);
  const [suggestedMatch, setSuggestedMatch] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    checkForDuplicate(name);
  }, [name]);

  const checkForDuplicate = async (inputName) => {
    if (!inputName) return;
    const snapshot = await getDocs(collection(db, "products"));
    const normalizedInput = inputName.toLowerCase();
    let match = null;

    snapshot.forEach((doc) => {
      const p = doc.data();
      const n = p.name.toLowerCase();
      if ((n.includes(normalizedInput) || normalizedInput.includes(n)) && n !== normalizedInput) {
        match = { id: doc.id, ...p };
      }
    });

    setSuggestedMatch(match);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      const selected = result.assets[0];
      setImages((prev) => [...prev, selected]);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("You must be logged in to submit a product.");
      return;
    }

    try {
      const imageUrls = [];

      for (let img of images) {
        const ext = img.uri.split(".").pop();
        const filename = `product-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const res = await fetch(img.uri);
        const blob = await res.blob();
        const imgRef = ref(storage, filename);
        await uploadBytes(imgRef, blob);
        const url = await getDownloadURL(imgRef);
        imageUrls.push(url);
      }

      await addDoc(collection(db, "products"), {
        name,
        category,
        description,
        images: imageUrls,
        seasonal,
        season: seasonal ? season : null,
        addedBy: user.email,
        approved: false,
        createdAt: serverTimestamp(),
      });

      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting product:", err);
      Alert.alert("Submission Error", "There was a problem adding your product.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      {!user ? (
        <View style={styles.centered}>
          <Text style={styles.error}>You must be logged in to add an item.</Text>
          <Button title="Log In" onPress={() => navigation.navigate("Auth")} />
        </View>
      ) : submitted ? (
        <View style={styles.centered}>
          <Text style={styles.success}>✅ Submitted for admin review!</Text>
          <Button title="+ Add Another" onPress={() => {
            setName("");
            setCategory(categories[0]);
            setDescription("");
            setSeasonal(false);
            setSeason("Winter");
            setImages([]);
            setSuggestedMatch(null);
            setSubmitted(false);
          }} />
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.title}>Add New Product</Text>

          <TextInput
            placeholder="Product Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(cat)}
                style={[
                  styles.categoryButton,
                  category === cat && styles.selectedCategory,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === cat && styles.selectedCategoryText,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TextInput
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            style={[styles.input, { height: 80 }]}
          />

          <TouchableOpacity onPress={pickImage} style={styles.imageButton}>
            <Text style={styles.imageButtonText}>📸 Add Image</Text>
          </TouchableOpacity>

          <ScrollView horizontal>
            {images.map((img, idx) => (
              <Image
                key={idx}
                source={{ uri: img.uri }}
                style={styles.previewImage}
              />
            ))}
          </ScrollView>

          <View style={styles.checkboxRow}>
            <TouchableOpacity onPress={() => setSeasonal((prev) => !prev)}>
              <Text style={styles.checkbox}>
                {seasonal ? "☑" : "☐"} Seasonal Product?
              </Text>
            </TouchableOpacity>
          </View>

          {seasonal && (
            <View style={styles.seasonRow}>
              <Text style={styles.label}>Season:</Text>
              {["Winter", "Spring", "Summer", "Fall"].map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSeason(s)}
                  style={[
                    styles.categoryButton,
                    season === s && styles.selectedCategory,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      season === s && styles.selectedCategoryText,
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {suggestedMatch && (
            <View style={styles.suggestionBox}>
              <Text style={styles.suggestionTitle}>⚠️ Did you mean:</Text>
              <Text style={styles.suggestionName}>{suggestedMatch.name}</Text>
              <Text style={styles.suggestionDesc}>{suggestedMatch.description}</Text>
              <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
                <Button
                  title="Yes, that's it"
                  onPress={() => navigation.navigate("ProductDetail", { productId: suggestedMatch.id })}
                />
                <Button
                  title="No, continue"
                  onPress={() => setSuggestedMatch(null)}
                  color="#4f46e5"
                />
              </View>
            </View>
          )}

          <Button title="Submit Product" onPress={handleSubmit} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
  centered: {
    marginTop: 80,
    alignItems: "center",
  },
  form: {
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  label: {
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 4,
  },
  categoryButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 6,
    marginRight: 8,
  },
  selectedCategory: {
    backgroundColor: "#1e40af",
  },
  categoryText: {
    fontSize: 14,
  },
  selectedCategoryText: {
    color: "#fff",
    fontWeight: "bold",
  },
  imageButton: {
    backgroundColor: "#4f46e5",
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
    marginBottom: 8,
  },
  imageButtonText: {
    color: "#fff",
    textAlign: "center",
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  checkboxRow: {
    marginTop: 8,
    marginBottom: 4,
  },
  checkbox: {
    fontSize: 16,
  },
  seasonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
    marginBottom: 8,
  },
  success: {
    color: "#16a34a",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  error: {
    color: "#b91c1c",
    fontSize: 16,
    marginBottom: 8,
  },
  suggestionBox: {
    backgroundColor: "#fef3c7",
    padding: 10,
    borderRadius: 8,
    marginVertical: 12,
  },
  suggestionTitle: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  suggestionName: {
    fontWeight: "bold",
    fontSize: 16,
  },
  suggestionDesc: {
    color: "#374151",
    fontSize: 14,
  },
});
