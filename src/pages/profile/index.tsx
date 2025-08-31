import React from 'react'
import { NextPage } from 'next'
import Head from 'next/head'
import Layout from '@/components/layout/Layout'
import UserProfile from '@/components/user/UserProfile'

const ProfilePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Profile - Bailanysta</title>
        <meta name="description" content="Your profile on Bailanysta - manage your posts and information" />
      </Head>
      
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <UserProfile />
        </div>
      </Layout>
    </>
  )
}

export default ProfilePage