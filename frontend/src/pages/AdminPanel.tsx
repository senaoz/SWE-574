import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User,
  UserRole,
  Transaction,
  TimeBankTransaction,
  FailedTransaction,
} from "@/types";
import {
  Button,
  Card,
  Select,
  Table,
  Badge,
  Text,
  Flex,
  Tabs,
  Dialog,
  Grid,
} from "@radix-ui/themes";
import { Pencil1Icon } from "@radix-ui/react-icons";
import api, { usersApi } from "@/services/api";
import { InterestChip } from "@/components/ui/InterestChip";

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState("users");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleUpdate, setRoleUpdate] = useState<UserRole>("user");
  const queryClient = useQueryClient();

  // Current user (to enforce: moderators cannot change admin roles)
  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => usersApi.getProfile().then((res) => res.data),
    enabled: !!localStorage.getItem("access_token"),
    retry: false,
  });

  const canEditUserRole = (user: User) => {
    if (!currentUser) return false;
    if (currentUser.role === "admin") return true;
    if (currentUser.role === "moderator" && user.role !== "admin") return true;
    return false;
  };

  // Fetch all users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => api.get("/users/").then((res) => res.data),
  });

  // Fetch all transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["admin", "transactions"],
    queryFn: () => api.get("/transactions/admin/all").then((res) => res.data),
  });

  // Fetch all TimeBank transactions
  const { data: timebankTransactions, isLoading: timebankLoading } = useQuery({
    queryKey: ["admin", "timebank-transactions"],
    queryFn: () =>
      usersApi.getAllTimeBankTransactions(1, 100).then((res) => res.data),
  });

  // Fetch service participation analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () =>
      api.get("/admin/analytics/service-participation").then((res) => res.data),
  });

  // Fetch failed transactions
  const { data: failedTransactions, isLoading: failedTransactionsLoading } =
    useQuery({
      queryKey: ["admin", "failed-transactions"],
      queryFn: () =>
        api
          .get("/admin/failed-transactions?page=1&limit=100")
          .then((res) => res.data),
    });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      api.put(`/users/${userId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setSelectedUser(null);
    },
  });

  const handleRoleUpdate = (user: User) => {
    setSelectedUser(user);
    setRoleUpdate(user.role);
  };

  const confirmRoleUpdate = () => {
    if (selectedUser) {
      updateRoleMutation.mutate({
        userId: selectedUser._id,
        role: roleUpdate,
      });
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "red";
      case "moderator":
        return "blue";
      case "user":
        return "green";
      default:
        return "gray";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "green";
      case "pending":
        return "yellow";
      case "cancelled":
        return "red";
      case "disputed":
        return "orange";
      default:
        return "gray";
    }
  };

  if (
    usersLoading ||
    transactionsLoading ||
    timebankLoading ||
    analyticsLoading ||
    failedTransactionsLoading
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Text>Loading...</Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Text size="6" weight="bold">
        Manage Users and Transactions
      </Text>
      <Text color="gray">
        Manage users and view system transactions and TimeBank transactions
      </Text>

      {analytics ? (
        <>
          {/* Summary Cards */}
          <Grid columns={{ initial: "1", md: "2", lg: "4" }} gap="4">
            <Card className="p-4">
              <Text size="2" color="gray" className="block mb-1">
                Total Services
              </Text>
              <Text size="5" weight="bold">
                {analytics.summary.total_services}
              </Text>
              {/*
                <Flex wrap="wrap" gap="2">
                {Object.entries(analytics.services_by_status || {}).map(
                  ([status, count]) => (
                    <span key={status} className="capitalize">
                      {status.replace("_", " ")}: {count as number}
                    </span>
                  ),
                )}
              </Flex>
               */}
            </Card>
            <Card className="p-4">
              <Text size="2" color="gray" className="block mb-1">
                Participation Rate
              </Text>
              <Text size="5" weight="bold" color="green">
                {analytics.summary.participation_rate}%
              </Text>
            </Card>
            <Card className="p-4">
              <Text size="2" color="gray" className="block mb-1">
                Avg Participants/Service
              </Text>
              <Text size="5" weight="bold">
                {analytics.summary.avg_participants_per_service}
              </Text>
            </Card>
            <Card className="p-4">
              <Text size="2" color="gray" className="block mb-1">
                Total Participants
              </Text>
              <Text size="5" weight="bold" color="blue">
                {analytics.summary.total_participants}
              </Text>
            </Card>
          </Grid>

          {/* Participation by Category */}
          <Card className="p-4">
            <Text size="4" weight="bold" className="block mb-3">
              Participation by Category
            </Text>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Category</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>
                    Total Services
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>
                    With Participants
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>
                    Total Participants
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>
                    Avg Participants
                  </Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {Object.entries(analytics.participation_by_category || {}).map(
                  ([category, data]: [string, any]) => (
                    <Table.Row key={category}>
                      <Table.Cell>
                        <Text weight="medium">{category}</Text>
                      </Table.Cell>
                      <Table.Cell>{data.total_services}</Table.Cell>
                      <Table.Cell>{data.services_with_participants}</Table.Cell>
                      <Table.Cell>{data.total_participants}</Table.Cell>
                      <Table.Cell>
                        {data.avg_participants.toFixed(2)}
                      </Table.Cell>
                    </Table.Row>
                  ),
                )}
              </Table.Body>
            </Table.Root>
          </Card>

          {/* Max Participants Service */}
          {analytics.max_participants_service && (
            <Card className="p-4">
              <Text size="4" weight="bold" className="block mb-3">
                Most Popular Service
              </Text>
              <Flex direction="column" gap="2">
                <Text size="3" weight="bold">
                  {analytics.max_participants_service.title}
                </Text>
                <Flex gap="4">
                  <Text size="2" color="gray">
                    Participants:{" "}
                    <Text weight="bold">
                      {analytics.max_participants_service.participants}/
                      {analytics.max_participants_service.max_participants}
                    </Text>
                  </Text>
                  <Text size="2" color="gray">
                    ID: {analytics.max_participants_service.id.slice(-8)}
                  </Text>
                </Flex>
              </Flex>
            </Card>
          )}

          {/* Join Request Statistics */}
          <Card className="p-4">
            <Text size="4" weight="bold" className="block mb-3">
              Service Statistics
            </Text>
            <Grid columns={{ initial: "1", md: "2", lg: "4" }} gap="4">
              <div>
                <Text size="2" color="gray" className="block mb-1">
                  Total Help Offers
                </Text>
                <Text size="4" weight="bold">
                  {analytics.join_requests.total}
                </Text>
              </div>
              <div>
                <Text size="2" color="gray" className="block mb-1">
                  Pending
                </Text>
                <Badge color="yellow" size="2">
                  {analytics.join_requests.pending}
                </Badge>
              </div>
              <div>
                <Text size="2" color="gray" className="block mb-1">
                  Approved
                </Text>
                <Badge color="green" size="2">
                  {analytics.join_requests.approved}
                </Badge>
              </div>
              <div>
                <Text size="2" color="gray" className="block mb-1">
                  Approval Rate
                </Text>
                <Text size="4" weight="bold" color="green">
                  {analytics.join_requests.approval_rate}%
                </Text>
              </div>
            </Grid>
          </Card>
        </>
      ) : (
        <Text>Loading analytics...</Text>
      )}

      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Trigger value="users">
            Users ({users?.length || 0})
          </Tabs.Trigger>
          <Tabs.Trigger value="transactions">
            Transactions ({transactions?.total || 0})
          </Tabs.Trigger>
          <Tabs.Trigger value="timebank">
            TimeBank Transactions ({timebankTransactions?.total || 0})
          </Tabs.Trigger>
          <Tabs.Trigger value="failed-transactions">
            Failed Transactions ({failedTransactions?.total || 0})
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="users" className="mt-6">
          <Card>
            <Flex direction="column" gap="4">
              <Text size="5" weight="bold">
                User Management
              </Text>

              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Username</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Interests</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Role</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Balance</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {users?.map((user: User) => (
                    <Table.Row key={user._id}>
                      <Table.Cell>
                        <Flex direction="column" gap="1">
                          <Text weight="medium">{user.username}</Text>
                          {user.full_name && (
                            <Text size="2" color="gray">
                              {user.full_name}
                            </Text>
                          )}
                        </Flex>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2">{user.email}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        {(user.interests?.length ?? 0) > 0 ? (
                          <Flex gap="1" wrap="wrap">
                            {user.interests!.map((interest) => (
                              <InterestChip
                                key={interest}
                                name={interest}
                                size="sm"
                                showIcon
                              />
                            ))}
                          </Flex>
                        ) : (
                          <Text size="2" color="gray">
                            —
                          </Text>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Flex gap="2">
                          <Badge color={user.is_active ? "green" : "red"}>
                            {user.is_active ? "Active" : "Inactive"}
                          </Badge>
                          {user.is_verified && (
                            <Badge color="blue">Verified</Badge>
                          )}
                        </Flex>
                      </Table.Cell>
                      <Table.Cell>
                        <Text>{user.timebank_balance.toFixed(1)}h</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Flex gap="2">
                          {canEditUserRole(user) ? (
                            <Button
                              size="1"
                              variant="soft"
                              onClick={() => handleRoleUpdate(user)}
                            >
                              <Pencil1Icon />
                              Edit Role
                            </Button>
                          ) : (
                            <Text size="2" color="gray">
                              —
                            </Text>
                          )}
                        </Flex>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Flex>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="transactions" className="mt-6">
          <Card>
            <Flex direction="column" gap="4">
              <Text size="5" weight="bold">
                All Transactions
              </Text>

              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>ID</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Service</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Provider</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Requester</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Hours</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>
                      Provider Confirmed
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>
                      Requester Confirmed
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {transactions?.transactions?.map(
                    (transaction: Transaction) => (
                      <Table.Row key={transaction._id}>
                        <Table.Cell>
                          <Text size="2" className="font-mono">
                            {transaction._id.slice(-8)}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="2">
                            {transaction.service?.title ||
                              transaction.service_id?.slice(-8) ||
                              "N/A"}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="2">
                            {transaction.provider?.full_name ||
                              transaction.provider?.username ||
                              transaction.provider_id?.slice(-8) ||
                              "N/A"}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="2">
                            {transaction.requester?.full_name ||
                              transaction.requester?.username ||
                              transaction.requester_id?.slice(-8) ||
                              "N/A"}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text weight="medium">
                            {transaction.timebank_hours}h
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge color={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge
                            color={
                              transaction.provider_confirmed ? "green" : "gray"
                            }
                            size="1"
                          >
                            {transaction.provider_confirmed ? "Yes" : "No"}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge
                            color={
                              transaction.requester_confirmed ? "green" : "gray"
                            }
                            size="1"
                          >
                            {transaction.requester_confirmed ? "Yes" : "No"}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="2">
                            {new Date(
                              transaction.created_at,
                            ).toLocaleDateString()}
                          </Text>
                        </Table.Cell>
                      </Table.Row>
                    ),
                  )}
                </Table.Body>
              </Table.Root>
            </Flex>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="timebank" className="mt-6">
          <Card>
            <Flex direction="column" gap="4">
              <Text size="5" weight="bold">
                TimeBank Transactions
              </Text>

              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>ID</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>User</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Amount</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Service</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {timebankTransactions?.transactions?.map(
                    (transaction: TimeBankTransaction) => (
                      <Table.Row key={transaction.id}>
                        <Table.Cell>
                          <Text size="2" className="font-mono">
                            {transaction.id.slice(-8)}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="2">
                            {transaction.user?.full_name ||
                              transaction.user?.username ||
                              transaction.user_id?.slice(-8) ||
                              "N/A"}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge
                            color={transaction.amount > 0 ? "green" : "red"}
                            size="1"
                          >
                            {transaction.amount > 0 ? "+" : ""}
                            {transaction.amount.toFixed(1)}h
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="2">{transaction.description}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="2" className="font-mono">
                            {transaction.service_id?.slice(-8) || "N/A"}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="2">
                            {new Date(
                              transaction.created_at,
                            ).toLocaleDateString()}
                          </Text>
                        </Table.Cell>
                      </Table.Row>
                    ),
                  )}
                </Table.Body>
              </Table.Root>
            </Flex>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="failed-transactions" className="mt-6">
          <Card>
            <Flex direction="column" gap="4">
              <Text size="5" weight="bold">
                Failed TimeBank Transactions
              </Text>
              <Text size="2" color="gray">
                Transactions that failed due to balance limits, insufficient
                funds, or other errors
              </Text>

              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>ID</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>User</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Amount</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Reason</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>
                      Balance at Failure
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Service</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>
                      Error Message
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {failedTransactions?.failed_transactions?.map(
                    (transaction: FailedTransaction) => (
                      <Table.Row key={transaction.id}>
                        <Table.Cell>
                          <Text size="2" className="font-mono">
                            {transaction.id.slice(-8)}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Flex direction="column" gap="1">
                            <Text size="2" weight="medium">
                              {transaction.user?.full_name ||
                                transaction.user?.username ||
                                transaction.user_id?.slice(-8) ||
                                "N/A"}
                            </Text>
                            {transaction.user?.email && (
                              <Text size="1" color="gray">
                                {transaction.user.email}
                              </Text>
                            )}
                          </Flex>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge
                            color={transaction.amount > 0 ? "green" : "red"}
                            size="1"
                          >
                            {transaction.amount > 0 ? "+" : ""}
                            {transaction.amount.toFixed(1)}h
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="2">{transaction.description}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge
                            color={
                              transaction.reason === "provider_balance_limit"
                                ? "orange"
                                : transaction.reason === "insufficient_balance"
                                  ? "red"
                                  : transaction.reason === "user_not_found"
                                    ? "purple"
                                    : "gray"
                            }
                            size="1"
                          >
                            {transaction.reason
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="2">
                            {transaction.user_balance_at_failure !== undefined
                              ? `${transaction.user_balance_at_failure.toFixed(
                                  1,
                                )}h`
                              : "N/A"}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          {transaction.service ? (
                            <Text size="2" weight="medium">
                              {transaction.service.title}
                            </Text>
                          ) : (
                            <Text size="2" color="gray" className="font-mono">
                              {transaction.service_id?.slice(-8) || "N/A"}
                            </Text>
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          <Text
                            size="1"
                            color="gray"
                            className="max-w-xs truncate"
                          >
                            {transaction.error_message || "N/A"}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="2">
                            {new Date(
                              transaction.created_at,
                            ).toLocaleDateString()}
                            <br />
                            <Text size="1" color="gray">
                              {new Date(
                                transaction.created_at,
                              ).toLocaleTimeString()}
                            </Text>
                          </Text>
                        </Table.Cell>
                      </Table.Row>
                    ),
                  )}
                </Table.Body>
              </Table.Root>

              {(!failedTransactions?.failed_transactions ||
                failedTransactions.failed_transactions.length === 0) && (
                <Text size="3" color="gray" className="text-center py-8">
                  No failed transactions found
                </Text>
              )}
            </Flex>
          </Card>
        </Tabs.Content>
      </Tabs.Root>

      {/* Role Update Dialog */}
      <Dialog.Root
        open={!!selectedUser}
        onOpenChange={(open) => {
          if (!open) setSelectedUser(null);
        }}
      >
        <Dialog.Content
          className="max-w-md w-full"
          aria-describedby={undefined}
        >
          <Flex direction="column" gap="4">
            <Dialog.Title>
              <Text size="4" weight="bold">
                Update User Role
              </Text>
            </Dialog.Title>
            {selectedUser && (
              <>
                <Text>Updating role for: {selectedUser.username}</Text>
                <Flex direction="column" gap="2">
                  <Text size="2" weight="medium">
                    New Role:
                  </Text>
                  <Select.Root
                    value={roleUpdate}
                    onValueChange={(value) => setRoleUpdate(value as UserRole)}
                  >
                    <Select.Trigger />
                    <Select.Content>
                      <Select.Item value="user">User</Select.Item>
                      <Select.Item value="moderator">Moderator</Select.Item>
                      <Select.Item value="admin">Admin</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Flex>
                <Flex gap="3" justify="end">
                  <Dialog.Close>
                    <Button
                      variant="soft"
                      onClick={() => setSelectedUser(null)}
                    >
                      Cancel
                    </Button>
                  </Dialog.Close>
                  <Button
                    onClick={confirmRoleUpdate}
                    disabled={updateRoleMutation.isPending}
                  >
                    {updateRoleMutation.isPending
                      ? "Updating..."
                      : "Update Role"}
                  </Button>
                </Flex>
              </>
            )}
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  );
}
