export default function Profile() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">My Profile</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your profile information and view your posts.
        </p>
      </div>

      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-start space-x-6">
          <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-2xl">U</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <h2 className="text-xl font-bold text-foreground">User Name</h2>
              <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Edit Profile
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">@username</p>
            <p className="text-foreground mb-4">
              This is a sample bio. Users will be able to write about themselves here and share their interests.
            </p>
            <div className="flex space-x-6 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <span className="font-medium text-foreground">0</span> Following
              </div>
              <div>
                <span className="font-medium text-foreground">0</span> Followers
              </div>
              <div>
                <span className="font-medium text-foreground">0</span> Posts
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button className="border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 py-2 px-1 text-sm font-medium">
            Posts
          </button>
          <button className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 py-2 px-1 text-sm font-medium">
            Replies
          </button>
          <button className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 py-2 px-1 text-sm font-medium">
            Likes
          </button>
        </nav>
      </div>

      {/* Posts Section */}
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <div className="mb-4">
          <svg className="mx-auto w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m10 0v10a2 2 0 01-2 2H9a2 2 0 01-2-2V8m10 0H7" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No posts yet</h3>
        <p className="mb-4">Start sharing your thoughts with the community!</p>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          Create Your First Post
        </button>
      </div>
    </div>
  );
}