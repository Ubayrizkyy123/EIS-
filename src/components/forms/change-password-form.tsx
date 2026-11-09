"use client";

import { useActionState, useEffect, useRef } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  changePasswordAction,
  type PasswordActionState,
} from "@/server/actions/profile";

const initialState: PasswordActionState = {};

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    changePasswordAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5">
      <FieldGroup>
        <Field data-invalid={Boolean(state.fieldErrors?.currentPassword)}>
          <FieldLabel htmlFor="currentPassword">Password saat ini</FieldLabel>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={Boolean(state.fieldErrors?.currentPassword)}
          />
          <FieldError
            errors={state.fieldErrors?.currentPassword?.map((message) => ({
              message,
            }))}
          />
        </Field>

        <Field data-invalid={Boolean(state.fieldErrors?.newPassword)}>
          <FieldLabel htmlFor="newPassword">Password baru</FieldLabel>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Minimal 8 karakter"
            required
            aria-invalid={Boolean(state.fieldErrors?.newPassword)}
          />
          <FieldError
            errors={state.fieldErrors?.newPassword?.map((message) => ({
              message,
            }))}
          />
        </Field>

        <Field data-invalid={Boolean(state.fieldErrors?.confirmPassword)}>
          <FieldLabel htmlFor="confirmPassword">
            Konfirmasi password baru
          </FieldLabel>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
          />
          <FieldError
            errors={state.fieldErrors?.confirmPassword?.map((message) => ({
              message,
            }))}
          />
        </Field>
      </FieldGroup>

      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      {state.success ? (
        <Alert>
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Menyimpan..." : "Ubah password"}
      </Button>
    </form>
  );
}
