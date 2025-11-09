# API 使用示例

## 快速开始

### 基础配置

```javascript
// API基础配置
const API_BASE_URL = 'http://localhost:3000/api'

// 通用请求函数
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  const response = await fetch(url, config)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'API request failed')
  }

  return data
}

// 带认证的请求函数
async function authenticatedRequest(endpoint, options = {}) {
  const token = localStorage.getItem('access_token')
  return apiRequest(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  })
}
```

## 1. 用户认证示例

### 用户注册

```javascript
async function registerUser(userData) {
  try {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })

    console.log('注册成功:', response.user)
    return response.user
  } catch (error) {
    console.error('注册失败:', error.message)
    throw error
  }
}

// 使用示例
registerUser({
  email: 'user@example.com',
  username: 'newuser',
  password: 'Password123!',
  name: 'New User',
})
```

### 用户登录

```javascript
async function loginUser(credentials) {
  try {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })

    // Token会自动存储在Cookie中，无需手动处理
    console.log('登录成功:', response.user)
    return response.user
  } catch (error) {
    console.error('登录失败:', error.message)
    throw error
  }
}

// 使用示例
loginUser({
  email: 'user@example.com',
  password: 'Password123!',
})
```

### 获取当前用户信息

```javascript
async function getCurrentUser() {
  try {
    const response = await authenticatedRequest('/auth/me')
    console.log('当前用户:', response.user)
    return response.user
  } catch (error) {
    console.error('获取用户信息失败:', error.message)
    throw error
  }
}

// 使用示例
getCurrentUser()
```

### 用户登出

```javascript
async function logoutUser() {
  try {
    const response = await authenticatedRequest('/auth/logout', {
      method: 'POST',
    })
    console.log('登出成功:', response.message)
    return response
  } catch (error) {
    console.error('登出失败:', error.message)
    throw error
  }
}

// 使用示例
logoutUser()
```

## 2. 文章管理示例

### 获取文章列表

```javascript
async function getPosts(params = {}) {
  try {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = `/posts${queryString ? `?${queryString}` : ''}`

    const response = await apiRequest(endpoint)
    console.log('文章列表:', response.posts)
    return response
  } catch (error) {
    console.error('获取文章列表失败:', error.message)
    throw error
  }
}

// 使用示例
getPosts({
  page: 1,
  limit: 10,
  published: true,
  search: 'javascript',
  tags: 'react,nodejs',
  sort: 'latest',
})
```

### 获取单个文章

```javascript
async function getPost(slug) {
  try {
    const response = await apiRequest(`/posts/${slug}`)
    console.log('文章详情:', response.post)
    return response.post
  } catch (error) {
    console.error('获取文章失败:', error.message)
    throw error
  }
}

// 使用示例
getPost('javascript-basics-tutorial')
```

### 创建文章

```javascript
async function createPost(postData) {
  try {
    const response = await authenticatedRequest('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    })

    console.log('文章创建成功:', response.post)
    return response.post
  } catch (error) {
    console.error('创建文章失败:', error.message)
    throw error
  }
}

// 使用示例
createPost({
  title: 'JavaScript 基础教程',
  content: '# JavaScript 基础\n\n这是一个详细的JavaScript教程...',
  excerpt: '学习JavaScript的基础知识',
  tags: ['javascript', 'tutorial', 'basics'],
  published: false,
  categoryIds: ['category-id'],
})
```

### 更新文章

```javascript
async function updatePost(slug, updateData) {
  try {
    const response = await authenticatedRequest(`/posts/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    })

    console.log('文章更新成功:', response.post)
    return response.post
  } catch (error) {
    console.error('更新文章失败:', error.message)
    throw error
  }
}

// 使用示例
updatePost('javascript-basics-tutorial', {
  title: 'JavaScript 基础教程 (更新版)',
  published: true,
})
```

### 删除文章

```javascript
async function deletePost(slug) {
  try {
    const response = await authenticatedRequest(`/posts/${slug}`, {
      method: 'DELETE',
    })

    console.log('文章删除成功:', response.message)
    return response
  } catch (error) {
    console.error('删除文章失败:', error.message)
    throw error
  }
}

// 使用示例
deletePost('old-article-slug')
```

### 文章点赞

```javascript
async function togglePostLike(slug) {
  try {
    const response = await authenticatedRequest(`/posts/${slug}/like`, {
      method: 'POST',
    })

    console.log('点赞操作:', response.message)
    return response
  } catch (error) {
    console.error('点赞失败:', error.message)
    throw error
  }
}

// 使用示例
togglePostLike('javascript-basics-tutorial')
```

### 获取热门文章

```javascript
async function getPopularPosts(limit = 5) {
  try {
    const response = await apiRequest(`/posts/popular?limit=${limit}`)
    console.log('热门文章:', response.posts)
    return response.posts
  } catch (error) {
    console.error('获取热门文章失败:', error.message)
    throw error
  }
}

// 使用示例
getPopularPosts(10)
```

## 3. 评论系统示例

### 获取文章评论

```javascript
async function getComments(postId, page = 1) {
  try {
    const response = await apiRequest(`/comments?postId=${postId}&page=${page}`)
    console.log('评论列表:', response.comments)
    return response
  } catch (error) {
    console.error('获取评论失败:', error.message)
    throw error
  }
}

// 使用示例
getComments('post-id', 1)
```

### 创建评论

```javascript
async function createComment(commentData) {
  try {
    const response = await authenticatedRequest('/comments', {
      method: 'POST',
      body: JSON.stringify(commentData),
    })

    console.log('评论创建成功:', response.comment)
    return response.comment
  } catch (error) {
    console.error('创建评论失败:', error.message)
    throw error
  }
}

// 使用示例 - 创建顶级评论
createComment({
  content: '这是一篇很棒的文章！',
  postId: 'post-id',
})

// 使用示例 - 回复评论
createComment({
  content: '我同意你的观点，特别是关于...',
  postId: 'post-id',
  parentId: 'parent-comment-id',
})
```

### 更新评论

```javascript
async function updateComment(commentId, content) {
  try {
    const response = await authenticatedRequest(`/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    })

    console.log('评论更新成功:', response.comment)
    return response.comment
  } catch (error) {
    console.error('更新评论失败:', error.message)
    throw error
  }
}

// 使用示例
updateComment('comment-id', '更新后的评论内容')
```

### 删除评论

```javascript
async function deleteComment(commentId) {
  try {
    const response = await authenticatedRequest(`/comments/${commentId}`, {
      method: 'DELETE',
    })

    console.log('评论删除成功:', response.message)
    return response
  } catch (error) {
    console.error('删除评论失败:', error.message)
    throw error
  }
}

// 使用示例
deleteComment('comment-id')
```

## 4. 搜索功能示例

### 全局搜索

```javascript
async function searchContent(query, options = {}) {
  try {
    const params = new URLSearchParams({
      q: query,
      ...options,
    })

    const response = await apiRequest(`/search?${params}`)
    console.log('搜索结果:', response)
    return response
  } catch (error) {
    console.error('搜索失败:', error.message)
    throw error
  }
}

// 使用示例
searchContent('javascript', {
  type: 'posts',
  page: 1,
  limit: 10,
  sortBy: 'relevance',
})

// 搜索用户
searchContent('john', {
  type: 'users',
})

// 搜索评论
searchContent('great article', {
  type: 'comments',
})
```

### 获取搜索建议

```javascript
async function getSearchSuggestions(query, limit = 10) {
  try {
    const response = await apiRequest(`/search/suggestions?q=${query}&limit=${limit}`)
    console.log('搜索建议:', response.suggestions)
    return response
  } catch (error) {
    console.error('获取搜索建议失败:', error.message)
    throw error
  }
}

// 使用示例
getSearchSuggestions('javas', 5)
```

### 获取热门搜索

```javascript
async function getPopularSearches(limit = 10) {
  try {
    const response = await apiRequest(`/search/popular?limit=${limit}`)
    console.log('热门搜索:', response.popularSearches)
    return response.popularSearches
  } catch (error) {
    console.error('获取热门搜索失败:', error.message)
    throw error
  }
}

// 使用示例
getPopularSearches(10)
```

## 5. 文件上传示例

### 上传文件

```javascript
async function uploadFile(file, options = {}) {
  try {
    const formData = new FormData()
    formData.append('file', file)

    // 可选参数
    if (options.directory) {
      formData.append('directory', options.directory)
    }
    if (options.maxSize) {
      formData.append('maxSize', options.maxSize.toString())
    }
    if (options.generateThumbnail) {
      formData.append('generateThumbnail', options.generateThumbnail.toString())
    }

    const response = await authenticatedRequest('/upload', {
      method: 'POST',
      headers: {}, // 不设置Content-Type，让浏览器自动设置
      body: formData,
    })

    console.log('文件上传成功:', response.file)
    return response.file
  } catch (error) {
    console.error('文件上传失败:', error.message)
    throw error
  }
}

// 使用示例
const fileInput = document.getElementById('file-input')
const file = fileInput.files[0]

uploadFile(file, {
  directory: 'images',
  generateThumbnail: true,
})
```

### 获取文件列表

```javascript
async function getUploadedFiles(page = 1, limit = 20) {
  try {
    const response = await authenticatedRequest(`/upload?page=${page}&limit=${limit}`)
    console.log('文件列表:', response.files)
    return response
  } catch (error) {
    console.error('获取文件列表失败:', error.message)
    throw error
  }
}

// 使用示例
getUploadedFiles(1, 20)
```

### 删除文件

```javascript
async function deleteFile(fileId) {
  try {
    const response = await authenticatedRequest(`/upload/${fileId}`, {
      method: 'DELETE',
    })

    console.log('文件删除成功:', response.message)
    return response
  } catch (error) {
    console.error('删除文件失败:', error.message)
    throw error
  }
}

// 使用示例
deleteFile('file-id')
```

## 6. 高级使用示例

### React Hooks 封装

```javascript
// useAuth.js
import { useState, useEffect, useCallback } from 'react'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const login = useCallback(async credentials => {
    setLoading(true)
    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })
      setUser(response.user)
      return response.user
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authenticatedRequest('/auth/logout', { method: 'POST' })
      setUser(null)
    } catch (error) {
      console.error('登出失败:', error)
    }
  }, [])

  const getCurrentUser = useCallback(async () => {
    try {
      const response = await authenticatedRequest('/auth/me')
      setUser(response.user)
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    getCurrentUser()
  }, [getCurrentUser])

  return {
    user,
    loading,
    login,
    logout,
    getCurrentUser,
  }
}

// usePosts.js
export function usePosts(params = {}) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const response = await apiRequest('/posts', {
        method: 'GET',
      })
      setPosts(response.posts)
      setPagination(response.pagination)
    } catch (error) {
      console.error('获取文章失败:', error)
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  return {
    posts,
    loading,
    pagination,
    refetch: fetchPosts,
  }
}
```

### Vue.js 组合式API封装

```javascript
// composables/useAuth.js
import { ref, computed } from 'vue'

export function useAuth() {
  const user = ref(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!user.value)

  const login = async credentials => {
    loading.value = true
    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })
      user.value = response.user
      return response.user
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      await authenticatedRequest('/auth/logout', { method: 'POST' })
      user.value = null
    } catch (error) {
      console.error('登出失败:', error)
    }
  }

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
  }
}
```

### 错误处理和重试机制

```javascript
class APIClient {
  constructor(baseURL = '/api') {
    this.baseURL = baseURL
    this.maxRetries = 3
    this.retryDelay = 1000
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    let lastError

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          ...options,
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'API request failed')
        }

        return data
      } catch (error) {
        lastError = error

        if (attempt < this.maxRetries && this.shouldRetry(error)) {
          await this.delay(this.retryDelay * Math.pow(2, attempt))
          continue
        }

        throw error
      }
    }

    throw lastError
  }

  shouldRetry(error) {
    // 网络错误或5xx错误才重试
    return (
      error.message.includes('fetch') ||
      error.message.includes('timeout') ||
      error.message.includes('Internal server error')
    )
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 使用示例
const apiClient = new APIClient()

// 带重试的请求
apiClient
  .request('/posts')
  .then(data => {
    console.log('请求成功:', data)
  })
  .catch(error => {
    console.error('请求失败:', error)
  })
```

## 7. 完整应用示例

### 博客文章列表组件

```javascript
function BlogList() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  const fetchPosts = async (pageNum = 1) => {
    setLoading(true)
    try {
      const response = await apiRequest(`/posts?page=${pageNum}&limit=10`)
      setPosts(response.posts)
      setPagination(response.pagination)
      setPage(pageNum)
    } catch (error) {
      console.error('获取文章失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handleLike = async slug => {
    try {
      await authenticatedRequest(`/posts/${slug}/like`, {
        method: 'POST',
      })
      // 重新获取文章列表以更新点赞数
      fetchPosts(page)
    } catch (error) {
      console.error('点赞失败:', error)
    }
  }

  if (loading) {
    return <div>加载中...</div>
  }

  return (
    <div className="blog-list">
      {posts.map(post => (
        <article key={post.id} className="blog-post">
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
          <div className="post-meta">
            <span>作者: {post.author.name}</span>
            <span>浏览: {post.viewCount}</span>
            <span>评论: {post._count.comments}</span>
            <span>点赞: {post._count.likes}</span>
          </div>
          <div className="post-actions">
            <button onClick={() => handleLike(post.slug)}>点赞</button>
            <Link href={`/posts/${post.slug}`}>阅读全文</Link>
          </div>
        </article>
      ))}

      {pagination && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => fetchPosts(page - 1)}>
            上一页
          </button>
          <span>
            第 {page} 页，共 {pagination.pages} 页
          </span>
          <button disabled={page >= pagination.pages} onClick={() => fetchPosts(page + 1)}>
            下一页
          </button>
        </div>
      )}
    </div>
  )
}
```

### 搜索组件

```javascript
function SearchComponent() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])

  // 防抖搜索
  const debouncedSearch = useMemo(
    () =>
      debounce(async searchQuery => {
        if (!searchQuery.trim()) {
          setResults(null)
          setSuggestions([])
          return
        }

        setLoading(true)
        try {
          const [searchResults, searchSuggestions] = await Promise.all([
            searchContent(searchQuery),
            getSearchSuggestions(searchQuery, 5),
          ])
          setResults(searchResults)
          setSuggestions(searchSuggestions.suggestions)
        } catch (error) {
          console.error('搜索失败:', error)
        } finally {
          setLoading(false)
        }
      }, 300),
    []
  )

  useEffect(() => {
    debouncedSearch(query)
  }, [query, debouncedSearch])

  const handleSearch = e => {
    setQuery(e.target.value)
  }

  return (
    <div className="search-component">
      <div className="search-input">
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="搜索文章、用户或评论..."
        />
        {loading && <div className="loading">搜索中...</div>}
      </div>

      {suggestions.length > 0 && (
        <div className="suggestions">
          <h4>搜索建议</h4>
          <ul>
            {suggestions.map((suggestion, index) => (
              <li key={index}>
                {suggestion.type === 'post' ? (
                  <Link href={`/posts/${suggestion.slug}`}>{suggestion.title}</Link>
                ) : (
                  <span>{suggestion.name}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {results && (
        <div className="search-results">
          <h3>搜索结果 ({results.total.all} 个结果)</h3>

          {results.posts?.length > 0 && (
            <div className="result-section">
              <h4>文章 ({results.total.posts})</h4>
              {results.posts.map(post => (
                <div key={post.id} className="result-item">
                  <Link href={`/posts/${post.slug}`}>{post.title}</Link>
                  <p>{post.excerpt}</p>
                </div>
              ))}
            </div>
          )}

          {results.users?.length > 0 && (
            <div className="result-section">
              <h4>用户 ({results.total.users})</h4>
              {results.users.map(user => (
                <div key={user.id} className="result-item">
                  <Link href={`/users/${user.username}`}>{user.name}</Link>
                  <p>{user.bio}</p>
                </div>
              ))}
            </div>
          )}

          {results.comments?.length > 0 && (
            <div className="result-section">
              <h4>评论 ({results.total.comments})</h4>
              {results.comments.map(comment => (
                <div key={comment.id} className="result-item">
                  <p>{comment.content}</p>
                  <small>
                    来自: <Link href={`/posts/${comment.post.slug}`}>{comment.post.title}</Link>
                  </small>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// 防抖工具函数
function debounce(func, delay) {
  let timeoutId
  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(this, args), delay)
  }
}
```

这些示例涵盖了API的主要使用场景，可以根据具体需求进行调整和扩展。
