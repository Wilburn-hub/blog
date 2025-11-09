'use client'

import { SidebarTagCloud, SidebarPopularTags } from './post-tags'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TagSearch } from '@/components/ui/tag-search'

interface PostSidebarProps {
  showTagCloud?: boolean
  showPopularTags?: boolean
  showTagSearch?: boolean
  className?: string
}

export function PostSidebar({
  showTagCloud = true,
  showPopularTags = true,
  showTagSearch = true,
  className,
}: PostSidebarProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* 标签搜索 */}
      {showTagSearch && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">搜索标签</CardTitle>
          </CardHeader>
          <CardContent>
            <TagSearch
              placeholder="输入标签名称..."
              onTagSelect={(tag) => {
                window.location.href = `/tags/${encodeURIComponent(tag.toLowerCase().replace(/\s+/g, '-'))}`
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* 热门标签 */}
      {showPopularTags && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">热门标签</CardTitle>
          </CardHeader>
          <CardContent>
            <SidebarPopularTags maxTags={10} />
          </CardContent>
        </Card>
      )}

      {/* 标签云 */}
      {showTagCloud && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">标签云</CardTitle>
          </CardHeader>
          <CardContent>
            <SidebarTagCloud maxTags={20} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}