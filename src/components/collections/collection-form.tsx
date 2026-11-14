"use client";

import { useState } from "react";

import { FormField } from "@/components/items/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface CollectionFormValues {
  name: string;
  description: string;
}

interface CollectionFormProps {
  idPrefix: string;
  initialValues?: CollectionFormValues;
  isPending: boolean;
  submitLabel: string;
  pendingLabel: string;
  onSubmit: (values: CollectionFormValues) => void;
}

/** Name and description fields shared by the new and edit collection dialogs. */
export function CollectionForm({
  idPrefix,
  initialValues,
  isPending,
  submitLabel,
  pendingLabel,
  onSubmit,
}: CollectionFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit({ name, description });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField id={`${idPrefix}-name`} label="Name">
        <Input
          id={`${idPrefix}-name`}
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </FormField>

      <FormField id={`${idPrefix}-description`} label="Description">
        <Textarea
          id={`${idPrefix}-description`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </FormField>

      <Button type="submit" disabled={isPending || name.trim() === ""}>
        {isPending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
