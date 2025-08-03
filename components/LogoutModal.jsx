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
import { UserContext } from "@/context/UserContext";

function LogoutModal({ isVisible, onClose, onConfirm }) {
  const { logout } = useContext(UserContext);
  const router = useRouter();
  
  const handleConfirm = () => {
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
                name="logout"
                size="xl"
                color="red.600"
              />
            </Box>
            
            <Text fontSize="lg" fontWeight="bold" textAlign="center">
              Confirm Logout
            </Text>
            
            <Text textAlign="center" color="gray.600">
              Are you sure you want to logout? Any unsaved changes will be lost.
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
                onPress={handleConfirm}
              >
                Logout
              </Button>
            </HStack>
          </VStack>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

export default LogoutModal;