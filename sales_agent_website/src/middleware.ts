import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/profile(.*)',
  '/dashboard(.*)',
  '/analytics(.*)',
  '/calls(.*)',
  '/task-runs(.*)',
  '/api/sheets/(.*)',
  '/api/user'
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};