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
  createUserAction,
  type UserActionState,
} from "@/server/actions/users";
import { APP_ROLES, roleLabels } from "@/types/auth";

const initialState: UserActionState = {};

export function UserForm() {
  const [state, formAction, isPending] = useActionState(
    createUserAction,
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
        <Field data-invalid={Boolean(state.fieldErrors?.name)}>
          <FieldLabel htmlFor="name">Nama</FieldLabel>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Nama lengkap"
            required
            aria-invalid={Boolean(state.fieldErrors?.name)}
          />
          <FieldError
            errors={state.fieldErrors?.name?.map((message) => ({ message }))}
          />
        </Field>

        <Field data-invalid={Boolean(state.fieldErrors?.email)}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nama@sekolah.sch.id"
            required
            aria-invalid={Boolean(state.fieldErrors?.email)}
          />
          <FieldError
            errors={state.fieldErrors?.email?.map((message) => ({ message }))}
          />
        </Field>

        <Field data-invalid={Boolean(state.fieldErrors?.password)}>
          <FieldLabel htmlFor="password">Password awal</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Minimal 8 karakter"
            required
            aria-invalid={Boolean(state.fieldErrors?.password)}
          />
          <FieldError
            errors={state.fieldErrors?.password?.map((message) => ({
              message,
            }))}
          />
        </Field>

        <Field data-invalid={Boolean(state.fieldErrors?.role)}>
          <FieldLabel htmlFor="role">Role</FieldLabel>
          <select
            id="role"
            name="role"
            defaultValue="OPERATOR"
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30"
            aria-invalid={Boolean(state.fieldErrors?.role)}
          >
            {APP_ROLES.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </select>
          <FieldError
            errors={state.fieldErrors?.role?.map((message) => ({ message }))}
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
        {isPending ? "Menyimpan..." : "Tambah pengguna"}
      </Button>
    </form>
  );
}
