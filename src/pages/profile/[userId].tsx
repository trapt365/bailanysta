import React from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Layout from '@/components/layout/Layout'
import UserProfile from '@/components/user/UserProfile'

const UserProfilePage: NextPage = () => {
  const router = useRouter()
  const { userId } = router.query

  return (
    <>
      <Head>
        <title>Profile - Bailanysta</title>
        <meta name="description" content="User profile on Bailanysta" />
      </Head>
      
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <UserProfile userId={userId as string} />
        </div>
      </Layout>
    </>
  )
}

export default UserProfilePage