import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher(['/']);

export default clerkMiddleware((auth, req) => {
  if (isPublicRoute(req)) {
    return; // Always allow access to public routes
  }
  auth().protect(); // Protect all other routes
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};