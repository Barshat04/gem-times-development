import React, { useState, useContext } from "react";
import { 
  Box,
  Pressable, 
  Icon,
  Text,
  Modal,
  VStack,
  Divider,
  HStack
} from "native-base";
import { MaterialIcons } from "@expo/vector-icons";
import { TaskContext } from "@/context/TaskContext";
import DiscardModal from "./DiscardModal";
import LogoutModal from "./LogoutModal";

function DropdownMenu() {
  const { viewPastTimesheets, setViewPastTimesheets } = useContext(TaskContext);
  const [isModalVisible, setModalVisible] = useState(false);
  const [discardModalVisible, setDiscardModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const toggleModal = () => setModalVisible((prev) => !prev);

  const togglePastTimeSheets = () => {
    setModalVisible(false);
    setViewPastTimesheets((prev) => !prev);
  };

  const openDiscardModal = () => {
    setModalVisible(false);
    setDiscardModalVisible(true);
  };

  const openLogoutModal = () => {
    setModalVisible(false);
    setLogoutModalVisible(true);
  };

  const menuItems = [
    {
      title: viewPastTimesheets ? "Active Timesheet" : "Past Timesheets",
      icon: "history",
      onPress: togglePastTimeSheets,
    },
    ...(viewPastTimesheets ? [] : [{
      title: "Discard Timesheet",
      icon: "delete",
      onPress: openDiscardModal,
      danger: true,
    }]),
    {
      title: "Logout",
      icon: "logout",
      onPress: openLogoutModal,
    }
  ];

  return (
    <>
      <Pressable
        position="absolute"
        top="5"
        right="5"
        zIndex={10}
        bg="emerald.500"
        borderRadius="full"
        p="2"
        shadow={3}
        _pressed={{
          bg: "emerald.700",
          shadow: 2
        }}
        onPress={toggleModal}
      >
        <Icon as={MaterialIcons} name="menu" size="md" color="white" />
      </Pressable>

      <Modal isOpen={isModalVisible} onClose={toggleModal} size="md">
        <Modal.Content borderRadius="lg" bg="gray.50">
          <Modal.CloseButton _icon={{ color: "emerald.600" }} />
          <Modal.Header bg="gray.50" borderBottomWidth="0" alignItems="center" justifyContent="center">
            <Text color="emerald.600" fontWeight="bold">Options</Text>
          </Modal.Header>
          <Divider bg="gray.200" />
          <Modal.Body p="0">
            <VStack divider={<Divider bg="gray.200" />} space="0">
              {menuItems.map((item, index) => (
                <Pressable
                  key={index}
                  py="4"
                  px="5"
                  _pressed={{
                    bg: "gray.200"
                  }}
                  onPress={item.onPress}
                >
                  <HStack space="3" alignItems="center">
                    <Icon 
                      as={MaterialIcons} 
                      name={item.icon} 
                      size="sm" 
                      color={item.danger ? "red.500" : "emerald.600"} 
                    />
                    <Text 
                      fontSize="md" 
                      color={item.danger ? "red.500" : "gray.700"}
                      fontWeight={item.title === "Logout" ? "semibold" : "normal"}
                    >
                      {item.title}
                    </Text>
                  </HStack>
                </Pressable>
              ))}
            </VStack>
          </Modal.Body>
        </Modal.Content>
      </Modal>

      <DiscardModal
        isVisible={discardModalVisible}
        onClose={() => setDiscardModalVisible(false)}
      />

      <LogoutModal 
        isVisible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
      />
    </>
  );
}

export default DropdownMenu;