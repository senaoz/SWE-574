import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Box, Button, Callout, Flex, Heading, Text } from "@radix-ui/themes";
import { CheckCircledIcon, CrossCircledIcon } from "@radix-ui/react-icons";
import { authApi } from "@/services/api";
import { useUser } from "@/contexts/UserContext";

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refetchUser } = useUser();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setErrorMessage("No verification token provided.");
      return;
    }

    authApi
      .verifyEmail(token)
      .then(() => {
        setStatus("success");
        refetchUser();
      })
      .catch((err) => {
        setStatus("error");
        setErrorMessage(
          err?.response?.data?.detail ?? "Verification failed. The link may have expired."
        );
      });
  }, [searchParams, refetchUser]);

  return (
    <Flex
      align="center"
      justify="center"
      style={{ minHeight: "60vh" }}
    >
      <Box style={{ maxWidth: 480, width: "100%", padding: "24px" }}>
        {status === "loading" && (
          <Text>Verifying your email…</Text>
        )}

        {status === "success" && (
          <Callout.Root color="green" size="3">
            <Callout.Icon>
              <CheckCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              <Heading size="4" mb="2">Email verified!</Heading>
              Your email address has been verified. You're all set.
            </Callout.Text>
          </Callout.Root>
        )}

        {status === "error" && (
          <Callout.Root color="red" size="3">
            <Callout.Icon>
              <CrossCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              <Heading size="4" mb="2">Verification failed</Heading>
              {errorMessage}
            </Callout.Text>
          </Callout.Root>
        )}

        {status !== "loading" && (
          <Flex mt="4" gap="3">
            <Button onClick={() => navigate("/dashboard")} variant="soft">
              Go to Dashboard
            </Button>
          </Flex>
        )}
      </Box>
    </Flex>
  );
}
