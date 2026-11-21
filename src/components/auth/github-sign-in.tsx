import { signInWithGitHub } from "@/actions/auth";
import { Button } from "@/components/ui/button";

interface GitHubSignInProps {
  label: string;
  callbackUrl: string;
}

/** An "or" divider followed by a GitHub OAuth button, shared by the sign-in and register forms. */
export function GitHubSignIn({ label, callbackUrl }: GitHubSignInProps) {
  return (
    <>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={signInWithGitHub}>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <Button type="submit" variant="outline" className="w-full">
          {label}
        </Button>
      </form>
    </>
  );
}
