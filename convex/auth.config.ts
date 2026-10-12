// convex/auth.config.ts
const authConfig = {
  providers: [
    {
      domain: "https://immense-warthog-7635.clerk.accounts.dev",
      applicationID: "convex", // ← must be "convex", not a dynamic env var
    },
  ],
};

export default authConfig;
