import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import Home from '../page'

// Mock the post service
jest.mock('@/lib/services/post.service', () => ({
  getPosts: jest.fn(),
  getFeaturedPosts: jest.fn(),
  getPopularPosts: jest.fn(),
}))

// Mock Next.js components
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
})

jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />
  }
})

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the home page', () => {
    const { getPosts, getFeaturedPosts, getPopularPosts } = require('@/lib/services/post.service')

    getPosts.mockResolvedValue({
      posts: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
    })
    getFeaturedPosts.mockResolvedValue([])
    getPopularPosts.mockResolvedValue([])

    render(<Home />)

    expect(screen.getByText(/Welcome to My Blog/i)).toBeInTheDocument()
  })

  it('displays featured posts', async () => {
    const { getPosts, getFeaturedPosts, getPopularPosts } = require('@/lib/services/post.service')

    const mockFeaturedPosts = [
      {
        id: '1',
        title: 'Featured Post 1',
        slug: 'featured-post-1',
        excerpt: 'This is a featured post',
        coverImage: 'https://example.com/image.jpg',
        author: { name: 'John Doe' },
        createdAt: new Date().toISOString(),
        _count: { comments: 5, likes: 10 },
      },
    ]

    getFeaturedPosts.mockResolvedValue(mockFeaturedPosts)
    getPosts.mockResolvedValue({
      posts: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
    })
    getPopularPosts.mockResolvedValue([])

    render(<Home />)

    await waitFor(() => {
      expect(screen.getByText('Featured Post 1')).toBeInTheDocument()
    })
  })

  it('displays recent posts', async () => {
    const { getPosts, getFeaturedPosts, getPopularPosts } = require('@/lib/services/post.service')

    const mockRecentPosts = [
      {
        id: '1',
        title: 'Recent Post 1',
        slug: 'recent-post-1',
        excerpt: 'This is a recent post',
        author: { name: 'Jane Doe' },
        createdAt: new Date().toISOString(),
        _count: { comments: 3, likes: 7 },
      },
    ]

    getPosts.mockResolvedValue({
      posts: mockRecentPosts,
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
    })
    getFeaturedPosts.mockResolvedValue([])
    getPopularPosts.mockResolvedValue([])

    render(<Home />)

    await waitFor(() => {
      expect(screen.getByText('Recent Post 1')).toBeInTheDocument()
    })
  })

  it('displays loading state', () => {
    const { getPosts, getFeaturedPosts, getPopularPosts } = require('@/lib/services/post.service')

    // Make the calls hang to simulate loading
    getPosts.mockImplementation(() => new Promise(() => {}))
    getFeaturedPosts.mockImplementation(() => new Promise(() => {}))
    getPopularPosts.mockImplementation(() => new Promise(() => {}))

    render(<Home />)

    // Check for loading indicators
    expect(screen.getByText(/Loading/i)).toBeInTheDocument()
  })

  it('handles error state', async () => {
    const { getPosts, getFeaturedPosts, getPopularPosts } = require('@/lib/services/post.service')

    getPosts.mockRejectedValue(new Error('Failed to fetch posts'))
    getFeaturedPosts.mockRejectedValue(new Error('Failed to fetch featured posts'))
    getPopularPosts.mockRejectedValue(new Error('Failed to fetch popular posts'))

    render(<Home />)

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
    })
  })

  it('shows pagination when there are multiple pages', async () => {
    const { getPosts, getFeaturedPosts, getPopularPosts } = require('@/lib/services/post.service')

    getPosts.mockResolvedValue({
      posts: [
        {
          id: '1',
          title: 'Post 1',
          slug: 'post-1',
          excerpt: 'Post 1 excerpt',
          author: { name: 'Author 1' },
          createdAt: new Date().toISOString(),
          _count: { comments: 0, likes: 0 },
        },
      ],
      pagination: { total: 25, page: 1, limit: 10, totalPages: 3 },
    })
    getFeaturedPosts.mockResolvedValue([])
    getPopularPosts.mockResolvedValue([])

    render(<Home />)

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 3/i)).toBeInTheDocument()
    })
  })
})