import { useState, useEffect } from "react";
import {
  Text,
  Flex,
  Button,
  Heading,
  Separator,
  Switch,
  Dialog,
  TextField,
} from "@radix-ui/themes";
import { LockClosedIcon, ExitIcon } from "@radix-ui/react-icons";
import { UserSettings, PasswordChangeForm, AccountDeletionForm } from "@/types";
import { usersApi } from "@/services/api";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useUser } from "@/contexts/UserContext";
import { useNavigate } from "react-router-dom";

export function SettingsPanel() {
  const navigate = useNavigate();
  const { user, refetchUser } = useUser();

  const [settings, setSettings] = useState<UserSettings>({
    profile_visible: true,
    show_email: false,
    show_location: true,
    email_notifications: true,
    service_matches_notifications: true,
    messages_notifications: true,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [deleteForm, setDeleteForm] = useState<AccountDeletionForm>({
    password: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    setSettings({
      profile_visible: user.profile_visible ?? true,
      show_email: user.show_email ?? false,
      show_location: user.show_location ?? true,
      email_notifications: user.email_notifications ?? true,
      service_matches_notifications:
        user.service_matches_notifications ?? true,
      messages_notifications: user.messages_notifications ?? true,
    });
  }, [user]);

  const handleSettingsChange = async (
    field: keyof UserSettings,
    value: boolean,
  ) => {
    const oldSettings = { ...settings };
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);
    setSettingsLoading(true);
    try {
      const response = await usersApi.updateSettings({ [field]: value });
      refetchUser();
      setSettings({
        profile_visible: response.data.profile_visible ?? true,
        show_email: response.data.show_email ?? false,
        show_location: response.data.show_location ?? true,
        email_notifications: response.data.email_notifications ?? true,
        service_matches_notifications:
          response.data.service_matches_notifications ?? true,
        messages_notifications: response.data.messages_notifications ?? true,
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      setSettings(oldSettings);
      alert("Failed to update settings. Please try again.");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      alert("New passwords do not match");
      return;
    }
    if (passwordForm.new_password.length < 8) {
      alert("Password must be at least 8 characters long");
      return;
    }
    if (!/[A-Z]/.test(passwordForm.new_password)) {
      alert("Password must contain at least one uppercase letter");
      return;
    }
    setPasswordLoading(true);
    try {
      await usersApi.changePassword(passwordForm);
      setShowPasswordDialog(false);
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error: any) {
      console.error("Error changing password:", error);
      alert(
        error.response?.data?.detail ||
          "Failed to change password. Please check your current password.",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteForm.password) {
      alert("Please enter your password to confirm account deletion");
      return;
    }
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await usersApi.deleteAccount(deleteForm);
      localStorage.removeItem("access_token");
      window.location.href = "/";
    } catch (error: any) {
      console.error("Error deleting account:", error);
      alert(
        error.response?.data?.detail ||
          "Failed to delete account. Please check your password.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleConfirmLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/");
    window.location.reload();
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <Heading size="4" mb="3">
            Privacy
          </Heading>
          <div className="space-y-3">
            <Flex justify="between" align="center">
              <div className="grid gap-1">
                <Text size="2" weight="bold">
                  Show Email
                </Text>
                <Text size="1" color="gray">
                  Display your email on your profile
                </Text>
              </div>
              <Switch
                  checked={settings.show_email}
                  onCheckedChange={(checked) =>
                      handleSettingsChange("show_email", checked)
                  }
                  disabled={settingsLoading}
              />
            </Flex>
            <Flex justify="between" align="center">
              <div className="grid gap-1">
                <Text size="2" weight="bold">
                  Show Location
                </Text>
                <Text size="1" color="gray">
                  Display your location on your profile
                </Text>
              </div>
              <Switch
                  checked={settings.show_location}
                  onCheckedChange={(checked) =>
                      handleSettingsChange("show_location", checked)
                  }
                  disabled={settingsLoading}
              />
            </Flex>
          </div>
        </div>

        <Separator />

        <div>
          <Heading size="4" mb="3">
            Notifications
          </Heading>
          <div className="space-y-3">
            <Flex justify="between" align="center">
              <div className="grid gap-1">
                <Text size="2" weight="bold">
                  Email Notifications
                </Text>
                <Text size="1" color="gray">
                  Receive notifications via email
                </Text>
              </div>
              <Switch
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) =>
                      handleSettingsChange("email_notifications", checked)
                  }
                  disabled={settingsLoading}
              />
            </Flex>
            <Flex justify="between" align="center">
              <div className="grid gap-1">
                <Text size="2" weight="bold">
                  Service Matches
                </Text>
                <Text size="1" color="gray">
                  Get notified when services match your needs
                </Text>
              </div>
              <Switch
                  checked={settings.service_matches_notifications}
                  onCheckedChange={(checked) =>
                      handleSettingsChange(
                          "service_matches_notifications",
                          checked,
                      )
                  }
                  disabled={settingsLoading}
              />
            </Flex>
            <Flex justify="between" align="center">
              <div className="grid gap-1">
                <Text size="2" weight="bold">
                  Messages
                </Text>
                <Text size="1" color="gray">
                  Get notified about new messages
                </Text>
              </div>
              <Switch
                  checked={settings.messages_notifications}
                  onCheckedChange={(checked) =>
                      handleSettingsChange("messages_notifications", checked)
                  }
                  disabled={settingsLoading}
              />
            </Flex>
          </div>
        </div>

        <Separator />

        <div>
          <Heading size="4" mb="3">
            Account
          </Heading>
          <div className="space-y-3">
            <Button
                variant="soft"
                size="2"
                className="w-full justify-start"
                onClick={() => setShowPasswordDialog(true)}
            >
              <LockClosedIcon className="w-4 h-4 mr-2" />
              Change Password
            </Button>
            <Button
                variant="soft"
                size="2"
                className="w-full justify-start"
                onClick={() => setLogoutConfirmOpen(true)}
            >
              <ExitIcon className="w-4 h-4 mr-2" />
              Logout
            </Button>
            <Button
                variant="soft"
                color="red"
                size="2"
                className="w-full justify-start"
                onClick={() => setShowDeleteDialog(true)}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </div>

      <Dialog.Root
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
      >
        <Dialog.Content className="max-w-md">
          <Dialog.Title>Change Password</Dialog.Title>
          <Dialog.Description className="mb-4">
            Enter your current password and choose a new one.
          </Dialog.Description>

          <div className="space-y-4">
            <div>
              <Text size="2" weight="bold" className="block mb-1">
                Current Password
              </Text>
              <TextField.Root
                type="password"
                value={passwordForm.current_password}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    current_password: e.target.value,
                  })
                }
                placeholder="Enter current password"
                size="2"
              />
            </div>
            <div>
              <Text size="2" weight="bold" className="block mb-1">
                New Password
              </Text>
              <TextField.Root
                type="password"
                value={passwordForm.new_password}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    new_password: e.target.value,
                  })
                }
                placeholder="Enter new password"
                size="2"
              />
            </div>
            <div>
              <Text size="2" weight="bold" className="block mb-1">
                Confirm New Password
              </Text>
              <TextField.Root
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirm_password: e.target.value,
                  })
                }
                placeholder="Confirm new password"
                size="2"
              />
            </div>
          </div>

          <Flex gap="3" mt="4" justify="end">
            <Button
              variant="soft"
              onClick={() => {
                setShowPasswordDialog(false);
                setPasswordForm({
                  current_password: "",
                  new_password: "",
                  confirm_password: "",
                });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handlePasswordChange} disabled={passwordLoading}>
              {passwordLoading ? "Changing..." : "Change Password"}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      <Dialog.Root open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <Dialog.Content className="max-w-md">
          <Dialog.Title color="red">Delete Account</Dialog.Title>
          <Dialog.Description className="mb-4">
            This action cannot be undone. This will permanently delete your
            account and all associated data.
          </Dialog.Description>

          <div className="space-y-4">
            <div>
              <Text size="2" weight="bold" className="block mb-1">
                Enter your password to confirm
              </Text>
              <TextField.Root
                type="password"
                value={deleteForm.password}
                onChange={(e) =>
                  setDeleteForm({ ...deleteForm, password: e.target.value })
                }
                placeholder="Enter your password"
                size="2"
              />
            </div>
          </div>

          <Flex gap="3" mt="4" justify="end">
            <Button
              variant="soft"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteForm({ password: "" });
              }}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete Account"}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete your account?"
        description="Are you sure you want to delete your account? This action cannot be undone."
        confirmLabel="Delete account"
        variant="danger"
        onConfirm={handleConfirmDeleteAccount}
      />
      <ConfirmDialog
        open={logoutConfirmOpen}
        onOpenChange={setLogoutConfirmOpen}
        title="Log out?"
        description="Are you sure you want to logout?"
        confirmLabel="Log out"
        onConfirm={handleConfirmLogout}
      />
    </>
  );
}