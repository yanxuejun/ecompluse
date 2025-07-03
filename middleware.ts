import { clerkMiddleware } from "@clerk/nextjs/server";

const middleware = clerkMiddleware();

export default middleware;

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}; 