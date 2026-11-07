import { Card, CardContent } from "@/components/ui/card";
import { ChangePasswordDialog } from "@/components/profile/change-password-dialog";
import { DeleteAccountDialog } from "@/components/profile/delete-account-dialog";

interface AccountActionsProps {
  email: string;
  hasPassword: boolean;
}

export function AccountActions({ email, hasPassword }: AccountActionsProps) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Account</h2>
      <Card>
        <CardContent className="flex flex-col gap-4">
          {hasPassword && (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Password</p>
                <p className="text-sm text-muted-foreground">Change the password you sign in with.</p>
              </div>
              <ChangePasswordDialog />
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Delete account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all of your items and collections.
              </p>
            </div>
            <DeleteAccountDialog email={email} />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
