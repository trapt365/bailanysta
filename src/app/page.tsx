export default function Feed() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Feed</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome to Bailanysta! This is your main feed where you'll see posts from people you follow.
        </p>
      </div>

      {/* Post Creation Area */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-medium">U</span>
          </div>
          <div className="flex-1">
            <textarea
              placeholder="What's on your mind?"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-foreground"
              rows={3}
            />
            <div className="flex justify-between items-center mt-3">
              <div className="flex space-x-2 text-gray-500">
                <span className="text-sm">0/280</span>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Posts */}
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">D</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-medium text-foreground">Demo User</span>
                <span className="text-gray-500 text-sm">@demo</span>
                <span className="text-gray-500 text-sm">·</span>
                <span className="text-gray-500 text-sm">2h ago</span>
              </div>
              <p className="text-foreground mb-3">
                Welcome to Bailanysta! This is a demo post to show how the feed will look. 
                You can create posts, interact with others, and build your community here. #bailanysta
              </p>
              <div className="flex items-center space-x-6 text-gray-500">
                <button className="flex items-center space-x-2 hover:text-blue-600 transition-colors">
                  <span className="text-sm">💬</span>
                  <span className="text-sm">0</span>
                </button>
                <button className="flex items-center space-x-2 hover:text-red-600 transition-colors">
                  <span className="text-sm">❤️</span>
                  <span className="text-sm">5</span>
                </button>
                <button className="flex items-center space-x-2 hover:text-green-600 transition-colors">
                  <span className="text-sm">🔄</span>
                  <span className="text-sm">2</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
