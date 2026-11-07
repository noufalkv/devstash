"use client";

import { useActionState, useState } from "react";

import { deleteAccount } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeleteAccountDialogProps {
  email: string;
}

function DeleteAccountForm({ email }: DeleteAccountDialogProps) {
  const [state, formAction, pending] = useActionState(deleteAccount, null);
  const [confirmEmail, setConfirmEmail] = useState("");
  const matches = confirmEmail.trim().toLowerCase() === email.toLowerCase();

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="confirmEmail">
          Type <span className="font-semibold">{email}</span> to confirm
        </Label>
        <Input
          id="confirmEmail"
          name="confirmEmail"
          type="email"
          autoComplete="off"
          value={confirmEmail}
          onChange={(event) => setConfirmEmail(event.target.value)}
          required
        />
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button
        type="submit"
        variant="destructive"
        className="w-full"
        disabled={pending || !matches}
      >
        {pending ? "Deleting..." : "Delete my account"}
      </Button>
    </form>
  );
}

export function DeleteAccountDialog({ email }: DeleteAccountDialogProps) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="destructive" />}>Delete account</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete account</DialogTitle>
          <DialogDescription>
            This permanently deletes your account, items and collections. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <DeleteAccountForm email={email} />
      </DialogContent>
    </Dialog>
  );
}
