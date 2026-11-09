"use client";

import { useActionState } from "react";

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
  updateSystemSettingsAction,
  type SettingsActionState,
} from "@/server/actions/settings";

const initialState: SettingsActionState = {};

type SystemSettingsFormProps = {
  settings: Record<string, string>;
};

export function SystemSettingsForm({ settings }: SystemSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateSystemSettingsAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FieldGroup>
        <Field data-invalid={Boolean(state.fieldErrors?.school_name)}>
          <FieldLabel htmlFor="school_name">Nama sekolah</FieldLabel>
          <Input
            id="school_name"
            name="school_name"
            defaultValue={settings.school_name ?? ""}
            placeholder="EIS Sekolah"
            required
            aria-invalid={Boolean(state.fieldErrors?.school_name)}
          />
          <FieldError
            errors={state.fieldErrors?.school_name?.map((message) => ({
              message,
            }))}
          />
        </Field>

        <Field data-invalid={Boolean(state.fieldErrors?.school_address)}>
          <FieldLabel htmlFor="school_address">Alamat</FieldLabel>
          <Input
            id="school_address"
            name="school_address"
            defaultValue={settings.school_address ?? ""}
            placeholder="Alamat sekolah"
            aria-invalid={Boolean(state.fieldErrors?.school_address)}
          />
          <FieldError
            errors={state.fieldErrors?.school_address?.map((message) => ({
              message,
            }))}
          />
        </Field>

        <Field data-invalid={Boolean(state.fieldErrors?.school_phone)}>
          <FieldLabel htmlFor="school_phone">Telepon</FieldLabel>
          <Input
            id="school_phone"
            name="school_phone"
            defaultValue={settings.school_phone ?? ""}
            placeholder="Nomor telepon sekolah"
            aria-invalid={Boolean(state.fieldErrors?.school_phone)}
          />
          <FieldError
            errors={state.fieldErrors?.school_phone?.map((message) => ({
              message,
            }))}
          />
        </Field>

        <Field data-invalid={Boolean(state.fieldErrors?.school_email)}>
          <FieldLabel htmlFor="school_email">Email sekolah</FieldLabel>
          <Input
            id="school_email"
            name="school_email"
            type="email"
            defaultValue={settings.school_email ?? ""}
            placeholder="sekolah@example.sch.id"
            aria-invalid={Boolean(state.fieldErrors?.school_email)}
          />
          <FieldError
            errors={state.fieldErrors?.school_email?.map((message) => ({
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
        {isPending ? "Menyimpan..." : "Simpan pengaturan"}
      </Button>
    </form>
  );
}
