import { useState, useEffect } from "react";
import {
  Card,
  Text,
  Flex,
  Avatar,
  Badge,
  Button,
  Heading,
  Separator,
  Grid,
  Box,
  TextField,
  TextArea,
  Switch,
  Dialog,
} from "@radix-ui/themes";
import {
  CheckCircledIcon,
  Crosshair1Icon,
  LockClosedIcon,
  Pencil1Icon,
  CheckIcon,
  Cross2Icon,
  ExitIcon,
  ExclamationTriangleIcon,
} from "@radix-ui/react-icons";
import {
  User,
  UserSettings,
  PasswordChangeForm,
  AccountDeletionForm,
  JoinRequest,
} from "@/types";
import { usersApi, joinRequestsApi } from "@/services/api";
import { MyServices } from "./MyServices";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

export function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    bio: "",
    location: "",
    email: "",
  });
  const [settings, setSettings] = useState<UserSettings>({
    profile_visible: true,
    show_email: false,
    show_location: true,
    email_notifications: true,
    service_matches_notifications: true,
    messages_notifications: true,
  });
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
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showRejectedRequestsDialog, setShowRejectedRequestsDialog] =
    useState(false);

  // Fetch rejected requests
  const { data: rejectedRequestsData } = useQuery({
    queryKey: ["rejected-requests"],
    queryFn: () => joinRequestsApi.getMyRequests(1, 50, "rejected"),
    enabled: true,
  });

  const rejectedRequests = rejectedRequestsData?.data.requests || [];
  const recentRejectedCount = rejectedRequests.filter((req: JoinRequest) => {
    const rejectedDate = new Date(req.updated_at);
    const daysSinceRejected =
      (Date.now() - rejectedDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceRejected <= 7; // Show notification for requests rejected in last 7 days
  }).length;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await usersApi.getProfile();
        const userData = response.data;
        setUser(userData);
        setEditForm({
          full_name: userData.full_name || "",
          bio: userData.bio || "",
          location: userData.location || "",
          email: userData.email || "",
        });
        // Load settings from user data
        setSettings({
          profile_visible: userData.profile_visible ?? true,
          show_email: userData.show_email ?? false,
          show_location: userData.show_location ?? true,
          email_notifications: userData.email_notifications ?? true,
          service_matches_notifications:
            userData.service_matches_notifications ?? true,
          messages_notifications: userData.messages_notifications ?? true,
        });
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const response = await usersApi.updateProfile(editForm);
      setUser(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating user profile:", error);
      // Keep editing mode open on error
    }
  };

  const handleCancel = () => {
    if (user) {
      setEditForm({
        full_name: user.full_name || "",
        bio: user.bio || "",
        location: user.location || "",
        email: user.email || "",
      });
    }
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSettingsChange = async (
    field: keyof UserSettings,
    value: boolean
  ) => {
    const oldSettings = { ...settings };
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);
    setSettingsLoading(true);

    try {
      const response = await usersApi.updateSettings({ [field]: value });
      setUser(response.data);
      // Update settings from response
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
      // Revert on error
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

    setPasswordLoading(true);
    try {
      await usersApi.changePassword(passwordForm);
      alert("Password changed successfully");
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
          "Failed to change password. Please check your current password."
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

    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );
    if (!confirmed) return;

    setDeleteLoading(true);
    try {
      await usersApi.deleteAccount(deleteForm);
      alert("Account deleted successfully");
      // Redirect to home page and clear auth
      localStorage.removeItem("access_token");
      window.location.href = "/";
    } catch (error: any) {
      console.error("Error deleting account:", error);
      alert(
        error.response?.data?.detail ||
          "Failed to delete account. Please check your password."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (!confirmed) return;

    // Clear auth token
    localStorage.removeItem("access_token");
    // Redirect to home page
    navigate("/");
    // Force page reload to clear any cached user data
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Text>Loading...</Text>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Text>User not found</Text>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Rejected Requests Notification */}
      {recentRejectedCount > 0 && (
        <Card className="p-4" style={{ backgroundColor: "var(--orange-2)" }}>
          <Flex align="center" justify="between">
            <Flex align="center" gap="3">
              <ExclamationTriangleIcon className="w-5 h-5" color="orange" />
              <div>
                <Text size="3" weight="bold">
                  {recentRejectedCount} Request
                  {recentRejectedCount > 1 ? "s" : ""} Rejected
                </Text>
                <Text size="2" color="gray" className="block">
                  You have {recentRejectedCount} rejected join request
                  {recentRejectedCount > 1 ? "s" : ""} from the last 7 days
                </Text>
              </div>
            </Flex>
            <Button
              variant="soft"
              onClick={() => setShowRejectedRequestsDialog(true)}
            >
              View Details
            </Button>
          </Flex>
        </Card>
      )}

      <Grid columns={{ initial: "1", md: "2" }} gap="6">
        <Flex align="center" justify="between" className="col-span-2">
          <Heading size="6">My Profile</Heading>
          {!isEditing ? (
            <Button onClick={handleEdit} size="2">
              <Pencil1Icon className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <Flex gap="2">
              <Button onClick={handleCancel} variant="soft" size="2">
                <Cross2Icon className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} size="2">
                <CheckIcon className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </Flex>
          )}
        </Flex>

        {/* Profile Information */}
        <Box>
          <Card size="4" className="p-6">
            <Heading size="5" mb="4">
              Profile Information
            </Heading>

            <div className="space-y-4">
              {/* Avatar and Basic Info */}
              <Flex align="center" gap="4">
                <Avatar
                  fallback={user.full_name?.[0] || user.username[0]}
                  size="6"
                />
                <div className="flex-1">
                  <Flex align="center" gap="2" mb="1">
                    <Heading size="4">
                      {isEditing ? (
                        <TextField.Root
                          value={editForm.full_name}
                          onChange={(e) =>
                            handleInputChange("full_name", e.target.value)
                          }
                          placeholder="Full Name"
                          size="2"
                        />
                      ) : (
                        user.full_name || user.username
                      )}
                    </Heading>
                    {user.is_verified && (
                      <CheckCircledIcon className="w-4 h-4 text-green-600" />
                    )}
                  </Flex>
                  <Text size="3" color="gray">
                    @{user.username}
                  </Text>
                  {user.is_verified && (
                    <Badge
                      color="green"
                      variant="soft"
                      size="1"
                      className="ml-2"
                    >
                      Verified User
                    </Badge>
                  )}
                </div>
              </Flex>

              {/* Email */}
              <div>
                <Text size="2" weight="bold" mr="2">
                  Email
                </Text>
                {isEditing ? (
                  <TextField.Root
                    value={editForm.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Email"
                    size="2"
                  />
                ) : (
                  <Text size="2">{user.email}</Text>
                )}
              </div>

              {/* Bio */}
              <div>
                <Text size="2" weight="bold" mr="2">
                  Bio
                </Text>
                {isEditing ? (
                  <TextArea
                    value={editForm.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    placeholder="Tell us about yourself..."
                    size="2"
                    rows={3}
                  />
                ) : (
                  <Text size="2">{user.bio || "No bio provided"}</Text>
                )}
              </div>

              {/* Location */}
              <div>
                <Text size="2" weight="bold" mr="2">
                  Location
                </Text>
                {isEditing ? (
                  <TextField.Root
                    value={editForm.location}
                    onChange={(e) =>
                      handleInputChange("location", e.target.value)
                    }
                    placeholder="Location"
                    size="2"
                  />
                ) : (
                  <Flex align="center" gap="2">
                    <Crosshair1Icon className="w-4 h-4" />
                    <Text size="2">
                      {user.location || "No location provided"}
                    </Text>
                  </Flex>
                )}
              </div>

              <Separator />

              {/* Stats */}
              <div className="space-y-2">
                <Flex justify="between" align="center">
                  <Text size="2">TimeBank Balance</Text>
                  <Text size="2" weight="bold">
                    {user.timebank_balance} hours
                  </Text>
                </Flex>
                <Flex justify="between" align="center">
                  <Text size="2">Member Since</Text>
                  <Text size="2">
                    {new Date(user.created_at).toLocaleDateString()}
                  </Text>
                </Flex>
                <Flex justify="between" align="center">
                  <Text size="2">Status</Text>
                  <Badge
                    color={user.is_active ? "green" : "red"}
                    variant="soft"
                  >
                    {user.is_active ? "Active" : "Inactive"}
                  </Badge>
                </Flex>
              </div>
            </div>
          </Card>
        </Box>

        {/* Settings */}
        <Box>
          <Card size="4" className="p-6">
            <Heading size="5" mb="4">
              Settings & Preferences
            </Heading>

            <div className="space-y-6">
              {/* Privacy Settings */}
              <div>
                <Heading size="4" mb="3">
                  Privacy
                </Heading>
                <div className="space-y-3">
                  {/*
                    <Flex justify="between" align="center">
                    <div className="grid gap-1">
                      <Text size="2" weight="bold">
                        Profile Visibility
                      </Text>
                      <Text size="1" color="gray">
                        Make your profile visible to other users
                      </Text>
                    </div>
                    <Switch
                      checked={settings.profile_visible}
                      onCheckedChange={(checked) =>
                        handleSettingsChange("profile_visible", checked)
                      }
                      disabled={settingsLoading}
                    />
                  </Flex> 
                    */}
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

              {/* Notification Settings */}
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
                          checked
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

              {/* Account Settings */}
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
                    onClick={handleLogout}
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
          </Card>
        </Box>
      </Grid>

      {/* Change Password Dialog */}
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

      {/* Delete Account Dialog */}
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

      {/* Rejected Requests Dialog */}
      <Dialog.Root
        open={showRejectedRequestsDialog}
        onOpenChange={setShowRejectedRequestsDialog}
      >
        <Dialog.Content className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <Dialog.Title>Rejected Join Requests</Dialog.Title>
          <Dialog.Description className="mb-4">
            Your join requests that have been rejected by service owners
          </Dialog.Description>

          {rejectedRequests.length === 0 ? (
            <Text color="gray">No rejected requests found.</Text>
          ) : (
            <div className="space-y-3">
              {rejectedRequests.map((request: JoinRequest) => (
                <Card key={request._id} className="p-4">
                  <Flex direction="column" gap="2">
                    <Flex justify="between" align="start">
                      <div className="flex-1">
                        <Text size="3" weight="bold" className="block">
                          {request.service?.title || "Unknown Service"}
                        </Text>
                        <Text size="2" color="gray" className="block mt-1">
                          Category: {request.service?.category || "N/A"}
                        </Text>
                        {request.message && (
                          <Text size="2" className="block mt-2">
                            Your message: "{request.message}"
                          </Text>
                        )}
                      </div>
                      <Badge color="red" variant="soft">
                        Rejected
                      </Badge>
                    </Flex>
                    {request.admin_message && (
                      <Card
                        className="p-3"
                        style={{ backgroundColor: "var(--red-2)" }}
                      >
                        <Text size="2" weight="bold" className="block mb-1">
                          Reason:
                        </Text>
                        <Text size="2">{request.admin_message}</Text>
                      </Card>
                    )}
                    <Text size="1" color="gray">
                      Rejected on:{" "}
                      {new Date(request.updated_at).toLocaleDateString()}
                    </Text>
                  </Flex>
                </Card>
              ))}
            </div>
          )}

          <Flex gap="3" mt="4" justify="end">
            <Button
              variant="soft"
              onClick={() => setShowRejectedRequestsDialog(false)}
            >
              Close
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      <MyServices />
    </div>
  );
}
