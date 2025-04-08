import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";

export default function ContactScreen() {
  const [formData, setFormData] = useState({
    from_name: "",
    from_email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const sendEmail = async () => {
    const { from_name, from_email, message } = formData;

    if (!from_name || !from_email || !message) {
      Alert.alert("Missing info", "Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service_id: "service_o8x38r8",
          template_id: "template_5wtlrhp",
          user_id: "3QC0yQNnVZWurgB7h",
          template_params: formData,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({ from_name: "", from_email: "", message: "" });
        setTimeout(() => setSuccess(false), 4000);
      } else {
        throw new Error("Failed to send email");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Contact Us</Text>
      <Text style={styles.subtitle}>
        Have a question, suggestion, or just want to say hi? We'd love to hear from you!
      </Text>

      <TextInput
        placeholder="Your Name"
        value={formData.from_name}
        onChangeText={(text) => handleChange("from_name", text)}
        style={styles.input}
      />
      <TextInput
        placeholder="Your Email"
        value={formData.from_email}
        onChangeText={(text) => handleChange("from_email", text)}
        style={styles.input}
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Your Message"
        value={formData.message}
        onChangeText={(text) => handleChange("message", text)}
        style={[styles.input, { height: 120 }]}
        multiline
      />

      {loading ? (
        <ActivityIndicator size="large" color="#4f46e5" />
      ) : (
        <Button title="Send Message" onPress={sendEmail} color="#4f46e5" />
      )}

      {success && (
        <Text style={styles.success}>✅ Message sent successfully!</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#111827",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
  success: {
    marginTop: 16,
    color: "#047857",
    fontWeight: "600",
    textAlign: "center",
  },
});