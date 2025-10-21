"use client";

import FieldInput from "@/components/forms/FieldInput";
import FooterLink from "@/components/forms/FooterLink";
import { Button } from "@/components/ui/button";
import React from "react";
import { useForm } from "react-hook-form";

const SigInPage = () => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });
  const onSubmit = async (data: SignInFormData) => {
    try {
      console.log(data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <h1 className="form-title">Log In Your Account</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FieldInput
          name="email"
          label="Email"
          placeholder="johndae@gmail.com"
          register={register}
          error={errors.email}
          validation={{
            required: "Email is required",
            pattern: /^\w+@\w+\.\w+$/,
            message: "Email address is required",
          }}
        />
        <FieldInput
          name="password"
          label="Password"
          placeholder="Enter a strong password"
          type="password"
          register={register}
          error={errors.password}
          validation={{ required: "Password is required", minLength: 8 }}
        />
      </form>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="yellow-btn mt-5 w-full"
      >
        {isSubmitting ? "Signing In" : "Log In"}
      </Button>
      <FooterLink
        text="Do not have an account? "
        linkText="Sign Up"
        href="/sign-up"
      />
    </>
  );
};

export default SigInPage;
