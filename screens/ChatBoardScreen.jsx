import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  doc,
  deleteDoc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import chatboardBanner from "../assets/chatboard2.jpg";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ChatBoardScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState("");
  const [newPostImage, setNewPostImage] = useState(null);
  const [comments, setComments] = useState({});
  const [likes, setLikes] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [expandedPosts, setExpandedPosts] = useState({});
  const navigation = useNavigation();

  useEffect(() => {
    const q = query(collection(db, "chat_posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {  
      const list = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            nickname: "Anonymous"
          };
        })
      );
      setPosts(list);
    });
    return () => unsubscribe();
  }, []);  

  useEffect(() => {
    const unsubscribers = [];
  
    posts.forEach((post) => {
      // Comments listener
      const commentQuery = query(
        collection(db, "chat_posts", post.id, "comments"),
        orderBy("createdAt", "asc")
      );
  
      const unsubscribeComments = onSnapshot(commentQuery, async (snapshot) => {
        const commentList = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const userDoc = await getDoc(doc(db, "users", data.userId));
            const nickname = userDoc.exists() ? userDoc.data().nickname : "Anonymous";
            return { id: docSnap.id, ...data, nickname };
          })
        );
        setComments((prev) => ({ ...prev, [post.id]: commentList }));
      });
  
      // Likes listener
      const likesRef = collection(db, "chat_posts", post.id, "likes");
      const unsubscribeLikes = onSnapshot(likesRef, (snapshot) => {
        setLikes((prev) => ({
          ...prev,
          [post.id]: snapshot.docs.map((doc) => doc.id),
        }));
      });
  
      // Track unsubscribers
      unsubscribers.push(unsubscribeComments, unsubscribeLikes);
    });
  
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [posts]);  

  const pickImage = async (setImage) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0]);
    }
  };

  const uploadImageAndGetURL = async (image) => {
    const res = await fetch(image.uri);
    const blob = await res.blob();
    const ext = image.uri.split(".").pop();
    const filename = `chat-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const imageRef = ref(storage, filename);
    await uploadBytes(imageRef, blob);
    return await getDownloadURL(imageRef);
  };

  const handleNewPost = async () => {
    if (!newPostText.trim() && !newPostImage) return;
    let imageUrl = "";
    if (newPostImage) imageUrl = await uploadImageAndGetURL(newPostImage);
    await addDoc(collection(db, "chat_posts"), {
        text: newPostText,
        image: imageUrl,
        createdAt: serverTimestamp(),
        userId: user.uid,
        userEmail: user.email, // <-- add this
      });      
    setNewPostText("");
    setNewPostImage(null);
  };

  const handleNewComment = async (postId) => {
    const text = commentInputs[postId];
    if (!text?.trim()) return;
    await addDoc(collection(db, "chat_posts", postId, "comments"), {
        text,
        createdAt: serverTimestamp(),
        userId: user.uid,
        userEmail: user.email, // <-- add this
      });      
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
  };

  const toggleLike = async (postId) => {
    const likeRef = doc(db, "chat_posts", postId, "likes", user.uid);
    const alreadyLiked = likes[postId]?.includes(user.uid);
    if (alreadyLiked) await deleteDoc(likeRef);
    else await setDoc(likeRef, { likedAt: serverTimestamp() });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    const diff = Date.now() - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={chatboardBanner}
        style={styles.bannerImage}
        resizeMode="cover"
      />
      {user ? (
        <View style={styles.newPostBox}>
            <TextInput
            placeholder="Write a new post..."
            value={newPostText}
            onChangeText={setNewPostText}
            style={styles.input}
            multiline
            />
            <TouchableOpacity
            onPress={() => pickImage(setNewPostImage)}
            style={styles.imageButton}
            >
            <Text style={styles.imageButtonText}>Add Image</Text>
            </TouchableOpacity>
            {newPostImage && (
            <Image source={{ uri: newPostImage.uri }} style={styles.previewImage} />
            )}
            <TouchableOpacity onPress={handleNewPost} style={styles.postButton}>
            <Text style={styles.postButtonText}>Post</Text>
            </TouchableOpacity>
        </View>
        ) : (
            <TouchableOpacity
            style={styles.loginNoticeBox}
            onPress={() => navigation.navigate("Auth")}
            activeOpacity={0.8}
          >
            <Text style={styles.loginNotice}>
              Please log in to post.
            </Text>
          </TouchableOpacity>          
       )}

      {posts.map((post) => (
        <View key={post.id} style={styles.post}>
          <Text style={styles.postText}>{post.text}</Text>
          {post.image && <Image source={{ uri: post.image }} style={styles.postImage} />}
          <Text style={styles.meta}>by {post.nickname} • {formatTime(post.createdAt)}</Text>
          <TouchableOpacity onPress={() => toggleLike(post.id)}>
            <Text style={styles.like}>👍 {likes[post.id]?.length || 0}</Text>
          </TouchableOpacity>

          {expandedPosts[post.id] && (
            <View style={styles.commentsSection}>
              {(comments[post.id] || []).map((comment) => (
                <View key={comment.id} style={styles.comment}>
                  <Text>{comment.text}</Text>
                  <Text style={styles.meta}>by {comment.nickname} • {formatTime(comment.createdAt)}</Text>
                </View>
              ))}
              {user && (
                <View style={{ marginTop: 8 }}>
                  <TextInput
                    placeholder="Add a comment..."
                    value={commentInputs[post.id] || ""}
                    onChangeText={(text) => setCommentInputs((prev) => ({ ...prev, [post.id]: text }))}
                    style={styles.input}
                  />
                  <TouchableOpacity onPress={() => handleNewComment(post.id)} style={styles.commentButton}>
                    <Text style={styles.commentButtonText}>Comment</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
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
  newPostBox: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  imageButton: {
    backgroundColor: "#6366f1",
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  imageButtonText: {
    color: "#fff",
    textAlign: "center",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  postButton: {
    backgroundColor: "#10b981",
    padding: 10,
    borderRadius: 6,
  },
  postButtonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  post: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  postText: {
    fontSize: 16,
    marginBottom: 4,
  },
  postImage: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  like: {
    fontSize: 14,
    color: "#3b82f6",
    marginBottom: 8,
  },
  commentsSection: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
  },
  comment: {
    backgroundColor: "#f3f4f6",
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  commentButton: {
    backgroundColor: "#10b981",
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  commentButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  loginNoticeBox: {
    marginBottom: 24,
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#fef3c7", // soft yellow
    borderColor: "#fcd34d",
    borderWidth: 1,
    alignItems: "center",
  },
  
  loginNotice: {
    color: "#b45309", // amber text
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  bannerImage: {
    width: "100%",
    height: 125,
    borderRadius: 12,
    marginBottom: 16,
  },  
});