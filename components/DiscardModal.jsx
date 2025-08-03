import React, { useContext } from "react";
import { useRouter } from "expo-router";
import { 
  Modal, 
  Text, 
  Button, 
  VStack, 
  HStack, 
  Icon,
  Box
} from "native-base";
import { MaterialIcons } from "@expo/vector-icons";
import { TaskContext } from "@/context/TaskContext";
import { UserContext } from "@/context/UserContext";

function DiscardModal({ isVisible, onClose }) {
  const { discardTimesheet } = useContext(TaskContext);
  const { logout } = useContext(UserContext);
  const router = useRouter();

  const handleDiscard = () => {
    discardTimesheet();
    logout();
    onClose();
    router.push("/login");
  };

  return (
    <Modal isOpen={isVisible} onClose={onClose} size="md">
      <Modal.Content borderRadius="lg">
        <Modal.CloseButton />
        <Modal.Body p={6}>
          <VStack space={4} alignItems="center">
            <Box bg="red.100" p={3} borderRadius="full">
              <Icon
                as={MaterialIcons}
                name="delete"
                size="xl"
                color="red.600"
              />
            </Box>
            
            <Text fontSize="lg" fontWeight="bold" textAlign="center">
              Discard Timesheet
            </Text>
            
            <Text textAlign="center" color="gray.600">
              Are you sure you want to discard this timesheet? This action cannot be undone.
            </Text>
            
            <HStack space={3} w="full" justifyContent="center" mt={2}>
              <Button
                flex={1}
                variant="outline"
                colorScheme="gray"
                onPress={onClose}
              >
                Cancel
              </Button>
              
              <Button
                bg="emerald.600"
                _pressed={{ bg: "emerald.800" }}
                flex={1}
                onPress={handleDiscard}
              >
                Discard
              </Button>
            </HStack>
          </VStack>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

export default DiscardModal;