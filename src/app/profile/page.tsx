'use client';

import { UserProfile } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  last_login: string;
}

const ProfilePage = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/user'); // Replace with your actual API endpoint
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Handle unauthorized or other errors
          router.push('/sign-in');
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        router.push('/sign-in');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please sign in to view your profile.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center pt-10">
      <div className="w-full max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold mb-6 text-center">User Profile</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="text-lg font-semibold">Username:</p>
            <p className="text-xl">{user.username}</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="text-lg font-semibold">Email:</p>
            <p className="text-xl">{user.email}</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="text-lg font-semibold">First Name:</p>
            <p className="text-xl">{user.first_name}</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="text-lg font-semibold">Last Name:</p>
            <p className="text-xl">{user.last_name}</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="text-lg font-semibold">Member Since:</p>
            <p className="text-xl">{new Date(user.created_at).toLocaleDateString()}</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg">
            <p className="text-lg font-semibold">Last Login:</p>
            <p className="text-xl">{new Date(user.last_login).toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-8 text-center">
          <button 
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;