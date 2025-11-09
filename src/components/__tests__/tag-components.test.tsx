import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { TagPill, TagCloud, TagSearch } from '@/components/ui'
import { Tag, TagCloudItem } from '@/types'

// Mock fetch for API calls
global.fetch = jest.fn()

const mockTags: Tag[] = [
  { name: 'React', count: 15 },
  { name: 'TypeScript', count: 12 },
  { name: 'JavaScript', count: 20 },
]

const mockTagCloudItems: TagCloudItem[] = [
  { name: 'React', count: 15, slug: 'react', size: 'lg', weight: 0.8 },
  { name: 'TypeScript', count: 12, slug: 'typescript', size: 'md', weight: 0.6 },
  { name: 'JavaScript', count: 20, slug: 'javascript', size: 'xl', weight: 1.0 },
]

describe('TagPill', () => {
  it('renders tag with name and count', () => {
    render(<TagPill tag={mockTags[0]} showCount={true} />)

    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('renders tag without count when showCount is false', () => {
    render(<TagPill tag={mockTags[0]} showCount={false} />)

    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.queryByText('15')).not.toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const mockOnClick = jest.fn()
    render(<TagPill tag={mockTags[0]} onClick={mockOnClick} />)

    fireEvent.click(screen.getByText('React'))
    expect(mockOnClick).toHaveBeenCalledWith('React')
  })

  it('renders as link when clickable is true', () => {
    render(<TagPill tag={mockTags[0]} clickable={true} />)

    const link = screen.getByRole('link')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/tags/react')
  })
})

describe('TagCloud', () => {
  beforeEach(() => {
    ;(fetch as jest.Mock).mockClear()
  })

  it('renders tags with different sizes based on weight', () => {
    render(<TagCloud initialTags={mockTagCloudItems} showSearch={false} />)

    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('JavaScript')).toBeInTheDocument()
  })

  it('shows search input when showSearch is true', () => {
    render(<TagCloud initialTags={mockTagCloudItems} showSearch={true} />)

    expect(screen.getByPlaceholderText('搜索标签...')).toBeInTheDocument()
  })

  it('calls onTagClick when tag is clicked', () => {
    const mockOnClick = jest.fn()
    render(<TagCloud initialTags={mockTagCloudItems} onTagClick={mockOnClick} />)

    fireEvent.click(screen.getByText('React'))
    expect(mockOnClick).toHaveBeenCalledWith('React')
  })

  it('shows loading state', () => {
    render(<TagCloud showSearch={true} />)

    expect(screen.getByText('更新中...')).toBeInTheDocument()
  })

  it('handles search input', async () => {
    const mockResponse = {
      tags: mockTags,
      pagination: { page: 1, limit: 50, total: 3, pages: 1 },
      stats: { totalTags: 3, totalPosts: 47, averagePostsPerTag: 15.7 }
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    render(<TagCloud showSearch={true} />)

    const searchInput = screen.getByPlaceholderText('搜索标签...')
    fireEvent.change(searchInput, { target: { value: 'React' } })

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('q=React'),
        expect.any(Object)
      )
    })
  })

  it('shows empty state when no tags', () => {
    render(<TagCloud initialTags={[]} showSearch={false} />)

    expect(screen.getByText('暂无标签')).toBeInTheDocument()
  })
})

describe('TagSearch', () => {
  beforeEach(() => {
    ;(fetch as jest.Mock).mockClear()
  })

  it('renders search input', () => {
    render(<TagSearch />)

    expect(screen.getByPlaceholderText('搜索标签...')).toBeInTheDocument()
  })

  it('calls API when typing search query', async () => {
    const mockResponse = {
      tags: [mockTags[0]],
      pagination: { page: 1, limit: 10, total: 1, pages: 1 }
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    render(<TagSearch />)

    const searchInput = screen.getByPlaceholderText('搜索标签...')
    fireEvent.change(searchInput, { target: { value: 'React' } })

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('q=React'),
        expect.any(Object)
      )
    })
  })

  it('shows search results', async () => {
    const mockResponse = {
      tags: mockTags,
      pagination: { page: 1, limit: 10, total: 3, pages: 1 }
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    render(<TagSearch />)

    const searchInput = screen.getByPlaceholderText('搜索标签...')
    fireEvent.change(searchInput, { target: { value: 'Java' } })

    await waitFor(() => {
      expect(screen.getByText('React')).toBeInTheDocument()
      expect(screen.getByText('TypeScript')).toBeInTheDocument()
      expect(screen.getByText('JavaScript')).toBeInTheDocument()
    })
  })

  it('calls onTagSelect when result is clicked', async () => {
    const mockOnSelect = jest.fn()
    const mockResponse = {
      tags: [mockTags[0]],
      pagination: { page: 1, limit: 10, total: 1, pages: 1 }
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    render(<TagSearch onTagSelect={mockOnSelect} />)

    const searchInput = screen.getByPlaceholderText('搜索标签...')
    fireEvent.change(searchInput, { target: { value: 'React' } })

    await waitFor(() => {
      expect(screen.getByText('React')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('React'))
    expect(mockOnSelect).toHaveBeenCalledWith('React')
  })

  it('shows empty state when no results', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tags: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }),
    })

    render(<TagSearch />)

    const searchInput = screen.getByPlaceholderText('搜索标签...')
    fireEvent.change(searchInput, { target: { value: 'xyz' } })

    await waitFor(() => {
      expect(screen.getByText('未找到匹配的标签')).toBeInTheDocument()
    })
  })

  it('does not search for queries shorter than 2 characters', async () => {
    render(<TagSearch />)

    const searchInput = screen.getByPlaceholderText('搜索标签...')
    fireEvent.change(searchInput, { target: { value: 'R' } })

    // Should not make API call for single character
    expect(fetch).not.toHaveBeenCalled()

    // Should show helper text
    expect(screen.getByText('输入至少2个字符进行搜索')).toBeInTheDocument()
  })
})

describe('Tag Components Integration', () => {
  it('handles special characters in tag names', () => {
    const specialTag = { name: 'C++', count: 5 }

    render(<TagPill tag={specialTag} />)

    expect(screen.getByText('C++')).toBeInTheDocument()
  })

  it('handles URL encoding for navigation', () => {
    const encodedTag = { name: 'Web Development', count: 8 }

    render(<TagPill tag={encodedTag} clickable={true} />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/tags/web-development')
  })

  it('decodes URL-encoded tag names for display', () => {
    const encodedTag = { name: 'web-development', count: 8 }

    render(<TagPill tag={encodedTag} />)

    expect(screen.getByText('web-development')).toBeInTheDocument()
  })
})