import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { db, storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import categories from "../constants/categories";

export default function EditProductForm({ product, onCancel, onSave }) {
  const { user } = useAuth();
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category);
  const [existingImages, setExistingImages] = useState(product.images || []);
  const [newImages, setNewImages] = useState([]);
  const [description, setDescription] = useState(product.description);
  const [seasonal, setSeasonal] = useState(product.seasonal || false);
  const [season, setSeason] = useState(product.season || "Winter");

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length > 0) {
      setNewImages((prev) => [...prev, result.assets[0]]);
    }
  };

  const handleRemoveExistingImage = (url) => {
    setExistingImages((prev) => prev.filter((img) => img !== url));
  };

  const handleRemoveNewImage = (uri) => {
    setNewImages((prev) => prev.filter((img) => img.uri !== uri));
  };

  const handleSubmit = async () => {
    try {
      const uploadedUrls = [];

      for (const img of newImages) {
        const response = await fetch(img.uri);
        const blob = await response.blob();
        const filename = `product-images/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.jpg`;
        const imageRef = ref(storage, filename);
        await uploadBytes(imageRef, blob);
        const url = await getDownloadURL(imageRef);
        uploadedUrls.push(url);
      }

      const finalImages = [...existingImages, ...uploadedUrls];

      await addDoc(collection(db, "product_edits"), {
        productId: product.id,
        name,
        category,
        description,
        images: finalImages,
        seasonal,
        season: seasonal ? season : null,
        approved: false,
        editedBy: user.email,
        createdAt: serverTimestamp(),
      });

      onSave?.();
    } catch (err) {
      console.error("Failed to submit edit:", err);
      alert("Error submitting edit");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Product name"
        style={styles.input}
      />

      <Text style={styles.label}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setCategory(cat)}
            style={[
              styles.categoryOption,
              category === cat && styles.selectedCategory,
            ]}
          >
            <Text
              style={{
                color: category === cat ? "white" : "black",
                fontWeight: "600",
              }}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Description"
        multiline
        style={[styles.input, { height: 100 }]}
      />

      <View style={styles.switchRow}>
        <Text>Seasonal?</Text>
        <Switch value={seasonal} onValueChange={setSeasonal} />
      </View>

      {seasonal && (
        <View style={styles.pickerRow}>
          <Text style={styles.label}>Season:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {["Winter", "Spring", "Summer", "Fall"].map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setSeason(s)}
                style={[
                  styles.seasonOption,
                  season === s && styles.selectedSeason,
                ]}
              >
                <Text style={{ color: season === s ? "white" : "black" }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <Text style={styles.label}>Images</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {existingImages.map((uri, i) => (
          <View key={i} style={styles.imageBox}>
            <Image source={{ uri }} style={styles.image} />
            <TouchableOpacity onPress={() => handleRemoveExistingImage(uri)}>
              <Text style={styles.remove}>✖</Text>
            </TouchableOpacity>
          </View>
        ))}
        {newImages.map((img, i) => (
          <View key={i} style={styles.imageBox}>
            <Image source={{ uri: img.uri }} style={styles.image} />
            <TouchableOpacity onPress={() => handleRemoveNewImage(img.uri)}>
              <Text style={styles.remove}>✖</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity onPress={pickImage} style={styles.addImageBox}>
          <Text style={styles.addImageText}>＋</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.buttonRow}>
        <Button title="Cancel" onPress={onCancel} color="#6b7280" />
        <Button title="Submit for Review" onPress={handleSubmit} color="#2563eb" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  label: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 12,
  },
  pickerRow: {
    marginBottom: 12,
  },
  categoryOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#e5e7eb",
    borderRadius: 20,
    marginRight: 8,
  },
  selectedCategory: {
    backgroundColor: "#4f46e5",
  },
  seasonOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#e5e7eb",
    borderRadius: 20,
    marginRight: 8,
  },
  selectedSeason: {
    backgroundColor: "#4f46e5",
  },
  imageBox: {
    position: "relative",
    marginRight: 10,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  remove: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#dc2626",
    color: "white",
    width: 20,
    height: 20,
    borderRadius: 10,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "bold",
    fontSize: 12,
  },
  addImageBox: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  addImageText: {
    fontSize: 24,
    color: "#6b7280",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
});