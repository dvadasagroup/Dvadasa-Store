import { clerkMiddleware } from "@clerk/nextjs/server";

const isPublicRoute = (path: string) => {
  // Define your public route logic manually
  const publicRoutes = ["/"];
  return publicRoutes.some((route) => path.startsWith(route));
};

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request.nextUrl.pathname)) {
    auth().protect();
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
