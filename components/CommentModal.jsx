import { queryClient } from "@/app/_layout";
import { useComments } from "@/hooks/useComments";

import axios from "@/lib/axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useContext } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Modal from "react-native-modal";
import { z } from "zod";

const commentSchema = z.object({
  comments: z.string(),
});

const CommentModal = ({ isVisible, onClose }) => {
  const { comments, updateComments } = useComments();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(commentSchema),
    defaultValues: { comments: comments },
  });

  useEffect(() => {
    reset({ comments });
  }, [comments]);

  const onSubmit = (data) => {
    updateComments(data.comments); // Update the comment in the context
    reset();
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={handleClose}
      style={styles.modal}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Comment box</Text>

        <Controller
          control={control}
          name="comments"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, styles.textArea]}
              value={value}
              onChangeText={onChange}
              placeholder="Comments..."
              multiline
              numberOfLines={4}
            />
          )}
        />
        {errors.comments && (
          <Text style={styles.errorText}>{errors.comments.message}</Text>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmit(onSubmit)}
          >
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.noButton]}
            onPress={handleClose}
          >
            <Text style={styles.noText}>No</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "80%",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    marginTop: 10,
  },
  button: {
    textAlign: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 10,
  },
  noButton: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#e0e0e0",
  },
  noText: {
    color: "#333",
  },
  yesButton: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#ff5252",
  },
  yesText: {
    color: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    width: "100%",
    marginBottom: 20,
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#4caf50",
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default CommentModal;
