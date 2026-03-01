import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi, usersApi } from "@/services/api";
import { Button, Card, TextField } from "@radix-ui/themes";
import { Form } from "radix-ui";
import { validateEmail, validatePassword } from "@/utils/utils";
import { InterestSelector } from "@/components/ui/InterestSelector";

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  full_name?: string;
  bio?: string;
  location?: string;
}

export function RegisterForm({
  setLoginDialogOpen,
  onSwitchToLogin,
}: {
  setLoginDialogOpen?: (open: boolean) => void;
  onSwitchToLogin?: () => void;
} = {}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<RegisterFormData>({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
    full_name: "",
    bio: "",
    location: "",
  });
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});
  const [showInterestOnboarding, setShowInterestOnboarding] = useState(false);

  if (localStorage.getItem("access_token") && !showInterestOnboarding) {
    setLoginDialogOpen?.(false);
    navigate("/profile?interests=true");
    return null;
  }

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: async (response) => {
      const token = response.data?.access_token;
      const user = response.data?.user;
      if (token) {
        localStorage.setItem("access_token", token);
        if (user) {
          queryClient.setQueryData(["currentUser"], user);
        }
        setShowInterestOnboarding(true);
        setLoginDialogOpen?.(false);
        navigate("/profile?interests=true");
        return;
      }
      const legacyUser = response.data as { email?: string; username?: string };
      if (legacyUser?.email && formData.password) {
        try {
          const loginRes = await authApi.login({
            email: formData.email,
            password: formData.password,
          });
          const loginToken = loginRes.data?.access_token;
          const loginUser = loginRes.data?.user;
          if (loginToken) {
            localStorage.setItem("access_token", loginToken);
            if (loginUser) {
              queryClient.setQueryData(["currentUser"], loginUser);
            }
            setShowInterestOnboarding(true);
            setLoginDialogOpen?.(false);
            navigate("/profile?interests=true");
            return;
          }
        } catch (e) {
          console.error("[Register] Fallback login after register failed:", e);
        }
      }
      setErrors({
        email: "Registration succeeded but sign-in failed. Please sign in.",
      });
    },
    onError: (error: any) => {
      const errorDetail = error.response?.data?.detail;
      if (errorDetail?.includes("Email already registered")) {
        setErrors({ email: errorDetail });
      } else if (errorDetail?.includes("Username already taken")) {
        setErrors({ username: errorDetail });
      } else {
        setErrors({ email: errorDetail || "Registration failed" });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Partial<RegisterFormData> = {};

    if (!formData.username) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Enter valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.valid) {
        newErrors.password = passwordValidation.message;
      }
    }

    if (!formData.confirm_password) {
      newErrors.confirm_password = "Please confirm your password";
    } else if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    registerMutation.mutate(formData);
  };

  return (
    <div>
      <div className="mb-4">
        <div className="text-2xl font-bold mb-2">Create Account</div>
        <div className="">
          Join The Hive community and start exchanging services
        </div>
      </div>
      <Form.Root onSubmit={handleSubmit} className="space-y-4">
        <Form.Field name="username" className="space-y-2">
          <div className="flex items-baseline justify-between">
            <Form.Label className="text-sm font-medium">Username *</Form.Label>
            <Form.Message className="text-red-500 text-sm" match="valueMissing">
              Username is required
            </Form.Message>
          </div>
          <Form.Control asChild>
            <TextField.Root
              type="text"
              placeholder="Choose a username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              required
              className={errors.username ? "border-red-500" : ""}
            />
          </Form.Control>
          {errors.username && (
            <div className="text-red-500 text-sm">{errors.username}</div>
          )}
        </Form.Field>

        <Form.Field name="email" className="space-y-2">
          <div className="flex items-baseline justify-between">
            <Form.Label className="text-sm font-medium">Email *</Form.Label>
            <Form.Message className="text-red-500 text-sm" match="valueMissing">
              Email is required
            </Form.Message>
            <Form.Message className="text-red-500 text-sm" match="typeMismatch">
              Please provide a valid email
            </Form.Message>
          </div>
          <Form.Control asChild>
            <TextField.Root
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              className={errors.email ? "border-red-500" : ""}
            />
          </Form.Control>
          {errors.email && (
            <div className="text-red-500 text-sm">{errors.email}</div>
          )}
        </Form.Field>

        <Form.Field name="password" className="space-y-2">
          <div className="flex items-baseline justify-between">
            <Form.Label className="text-sm font-medium">Password *</Form.Label>
            <Form.Message className="text-red-500 text-sm" match="valueMissing">
              Password is required
            </Form.Message>
          </div>
          <Form.Control asChild>
            <TextField.Root
              type="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              className={errors.password ? "border-red-500" : ""}
            />
          </Form.Control>
          {errors.password && (
            <div className="text-red-500 text-sm">{errors.password}</div>
          )}
        </Form.Field>

        <Form.Field name="confirm_password" className="space-y-2">
          <div className="flex items-baseline justify-between">
            <Form.Label className="text-sm font-medium">
              Confirm Password *
            </Form.Label>
            <Form.Message className="text-red-500 text-sm" match="valueMissing">
              Please confirm your password
            </Form.Message>
          </div>
          <Form.Control asChild>
            <TextField.Root
              type="password"
              placeholder="Confirm your password"
              value={formData.confirm_password}
              onChange={(e) =>
                setFormData({ ...formData, confirm_password: e.target.value })
              }
              required
              className={errors.confirm_password ? "border-red-500" : ""}
            />
          </Form.Control>
          {errors.confirm_password && (
            <div className="text-red-500 text-sm">
              {errors.confirm_password}
            </div>
          )}
        </Form.Field>

        <Form.Field name="full_name" className="space-y-2">
          <Form.Label className="text-sm font-medium">Full Name</Form.Label>
          <Form.Control asChild>
            <TextField.Root
              type="text"
              placeholder="Your full name (optional)"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
            />
          </Form.Control>
        </Form.Field>

        <Form.Field name="bio" className="space-y-2">
          <Form.Label className="text-sm font-medium">Bio</Form.Label>
          <Form.Control asChild>
            <TextField.Root
              type="text"
              placeholder="Tell us about yourself (optional)"
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
            />
          </Form.Control>
        </Form.Field>

        <Form.Field name="location" className="space-y-2">
          <Form.Label className="text-sm font-medium">Location</Form.Label>
          <Form.Control asChild>
            <TextField.Root
              type="text"
              placeholder="Your location (optional)"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
            />
          </Form.Control>
        </Form.Field>

        <Form.Submit asChild>
          <Button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full"
          >
            {registerMutation.isPending
              ? "Creating account..."
              : "Create Account"}
          </Button>
        </Form.Submit>
      </Form.Root>
      <p className="mt-6 text-center text-sm ">
        Already have an account?{" "}
        {onSwitchToLogin ? (
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-lime-600 hover:underline font-medium"
          >
            Sign in
          </button>
        ) : (
          <a
            href="/?login=true"
            className="text-lime-600 hover:underline font-medium"
          >
            Sign in
          </a>
        )}
      </p>
    </div>
  );
}
